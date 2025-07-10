import { Prisma, PrismaClient } from "@prisma/client";
import { CreatePaymentDto, CreateRefundDto, PaymentResponseDto, RefundPaymentDto, ReversePaymentDto, UpdatePaymentDto } from "../types/payment.dto";
import { auditService } from "@modules/audit/services/audit.service";
import { AppError, ErrorCode } from "@common/constants/app.errors";
import { HttpStatusCode } from "@common/constants/http";
import { eventEmitter } from "@events/event.emitter";
import { cacheService } from "@cache/cache.service";
import { logger } from "@logging/logger";
import { paymentEvents } from "@events/types/paymentEvents.dto";
import { eventBus } from "@events/eventBus";
import { EVENTS } from "@events/events";

const prisma = new PrismaClient();



export class PaymentService {

  private cacheKey(tenantId: string) {
    return `payments:${tenantId}`;
  }


  //V1 Services
      async create(
    tenantId: string,
    userId: string,
    dto: CreatePaymentDto
  ): Promise<PaymentResponseDto> {

    const rec = await prisma.payment.create({
      data: {
        tenantId,
        purchaseOrder: dto.purchaseOrderId
          ? { connect: { id: dto.purchaseOrderId } }
          : undefined,
        posTransaction: dto.transactionId
          ? { connect: { id: dto.transactionId } }
          : undefined,
        amount:      dto.amount,
        method:      dto.method,
        reference:   dto.reference,
        paidAt: dto.paidAt,
        createdBy:   { connect: { id: userId } },
      },
    });

    // after creating payment:
if (dto.purchaseOrderId) {
  // 1) adjust PO balance
  const po = await prisma.purchaseOrder.update({
    where:{ id: dto.purchaseOrderId },
    data: { 
      // assume you have an outstandingAmount field
      outstandingAmount: { decrement: dto.amount },
      status: {
        set: 
        /* if outstandingAmount <= 0 then 'paid' else keep existing */
        dto.amount <= 0? 'paid' : dto.status  // assuming status is a string field
      }
    }
  });
}

    if (dto.transactionId) {
      // 2) mark POS transaction as paid
      await prisma.posTransaction.update({
        where:{ id: dto.transactionId },
        data:{ status:'paid' }
      });
    }

    await cacheService.del(this.cacheKey(tenantId));
    await auditService.log({
      tenantId,
      userId,
      module:   'Payment',
      action:   'create',
      entityId: rec.id,
      details:  dto,
    });
    eventBus.emit(EVENTS.PAYMENT_CREATED, rec);
    return rec;
  }

  //resource only available to root (System) Admin 
  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdatePaymentDto
  ): Promise<PaymentResponseDto> {
    const existing = await this.getById(tenantId, id);
    const rec = await prisma.payment.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: { connect: { id: userId } },
      },
    });
    await cacheService.del(this.cacheKey(tenantId));
    await auditService.log({
      tenantId,
      userId,
      module:   'Payment',
      action:   'update',
      entityId: id,
      details:  dto,
    });
    eventBus.emit(EVENTS.PAYMENT_UPDATED, rec);
    return rec;
  }

    async delete(tenantId: string, userId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    await prisma.payment.delete({ where: { id } });
    await cacheService.del(this.cacheKey(tenantId));
    await auditService.log({
      tenantId,
      userId,
      module:   'Payment',
      action:   'delete',
      entityId: id,
      details:  {},
    });
    eventBus.emit(EVENTS.PAYMENT_DELETED, existing);
  }

  // in payment.service.ts
async refund(
  tenantId: string,
  userId: string,
  id: string,
  dto: RefundPaymentDto
) {
  const orig = await this.getById(tenantId, id);
  if (orig.status !== 'completed') 
    throw new AppError('Only completed payments can be refunded', 400);

  const refundAmount = dto.amount ?? orig.amount;
  // 1) mark original as refunded (or partial)
  await prisma.payment.update({
    where:{ id },
    data: { status:'refunded', updatedBy:{ connect:{ id:userId } }, reference: dto.reason }
  });

  // 2) optionally create a negative‐amount payment record
  const refundRec = await prisma.payment.create({
    data:{
      tenantId,
      amount:       -refundAmount,
      method:       orig.method,
      reference:    `refund for ${id}`,
      status:       'completed',
      paidAt:       new Date(),
      user:         { connect:{ id:userId } },
      transaction:  orig.transactionId ? { connect:{ id:orig.transactionId } } : undefined,
      purchaseOrder: orig.purchaseOrderId ? { connect:{ id:orig.purchaseOrderId } } : undefined,
    }
  });

  // 3) adjust related modules (PO, TXN) back
  if (orig.purchaseOrderId) {
    await prisma.purchaseOrder.update({
      where:{ id: orig.purchaseOrderId },
      data:{ outstandingAmount: { increment: refundAmount }, status:'pending' }
    });
  }
  if (orig.transactionId) {
    await prisma.posTransaction.update({
      where:{ id: orig.transactionId },
      data:{ status:'refunded' }
    });
  }

  // 4) audit & event
  await auditService.log({ tenantId, userId, module:'Payment', action:'refund', entityId:refundRec.id, details: dto });
  eventBus.emit(EVENTS.PAYMENT_REFUNDED, refundRec);

  return refundRec;
}

async reverse(
  tenantId:string,
  userId:string,
  id:string,
  dto:ReversePaymentDto
) {
  const orig = await this.getById(tenantId, id);
  if (orig.status !== 'pending')
    throw new AppError('Only pending payments can be reversed', 400);

  const rec = await prisma.payment.update({
    where:{ id },
    data:{ status:'cancelled', reference: dto.reason, updatedBy:{ connect:{ id:userId } } }
  });
  await auditService.log({ tenantId, userId, module:'Payment', action:'reverse', entityId:id, details: dto });
  eventBus.emit(EVENTS.PAYMENT_REVERSED, rec);
  return rec;
}


  //V2 Services
  /**
   * Creates a payment and updates the related transaction or purchase order.
   */
  async createPayment(tenantId: string, userId: string, dto: CreatePaymentDto) {
    return prisma.$transaction(async (tx) => {
      // 1. Create the payment record
      const payment = await tx.payment.create({
        data: {
          ...dto,
          paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date()
        }
      });

      // 2. If linked to a transaction, update its payment status
      if (dto.transactionId) {
        const transaction = await tx.transaction.findUnique({ where: { id: dto.transactionId } });
        if (!transaction) throw new AppError("Transaction not found", HttpStatusCode.NOT_FOUND);

        const totalPaid = (await tx.payment.aggregate({
          where: { transactionId: dto.transactionId, status: "completed" },
          _sum: { amount: true },
        }))._sum.amount || 0;

        let paymentStatus = "partial";
        if (totalPaid >= transaction.totalAmount) {
          paymentStatus = "paid";
        }
        await tx.transaction.update({ where: { id: dto.transactionId }, data: { paymentStatus } });
        await cacheService.del(`pos-receipt:${dto.transactionId}`);
      }

      // 3. If linked to a purchase order, update its status (simplified example)
      if (dto.purchaseOrderId) {
        // Similar logic to update purchase order status can be implemented here
        await cacheService.del(`po-details:${dto.purchaseOrderId}`);
      }

      // 4. Audit and emit event
      await auditService.log({
        tenantId: tenantId,
        userId: userId,
        action: "PAYMENT_CREATE",
        module: "Payment",
        entityId: payment.id,
        details: JSON.stringify({ amount: dto.amount, method: dto.method })
      });

      eventEmitter.emit(paymentEvents.PAYMENT_COMPLETED, { paymentId: payment.id, amount: payment.amount });

      return payment;
    });
  }

  
  /**
   * Reverses a payment and updates the related transaction or purchase order.
   */
  async reversePayment(id: string, reason: string, userId: string, tenantId: string) {
    return prisma.$transaction(async (tx) => {
      const existingPayment = await tx.payment.findUnique({ where: { id } });
      if (!existingPayment) {
          throw new AppError("Payment not found.", HttpStatusCode.NOT_FOUND);
      }
      if (existingPayment.status === 'reversed') {
          throw new AppError("Payment has already been reversed.", HttpStatusCode.BAD_REQUEST);
      }

      const payment = await tx.payment.update({
        where: { id },
        data: { status: "reversed", reference: `Reversed: ${reason}` },
      });

      // Update related transaction/PO status back to pending/partial
      if (payment.transactionId) {
          await tx.transaction.update({ where: { id: payment.transactionId }, data: { paymentStatus: 'partial' } });
          await cacheService.del(`pos-receipt:${payment.transactionId}`);
      }

      await auditService.log({
        tenantId,
        userId,
        action: "PAYMENT_REVERSAL",
        module: "Payment",
        entityId: id,
        details: JSON.stringify({ reason }),
      });

      eventEmitter.emit(paymentEvents.PAYMENT_REVERSED, { paymentId: id });
      
      return payment;
    });
  }

  /**
   * Creates a refund by reversing an original payment and creating a new negative payment.
   */
  async createRefund(dto: CreateRefundDto) {
    const originalPayment = await prisma.payment.findUnique({ where: { id: dto.originalPaymentId } });
    if (!originalPayment) {
        throw new AppError("Original payment to refund not found.", HttpStatusCode.NOT_FOUND);
    }
    if (dto.amount > originalPayment.amount) {
        throw new AppError("Refund amount cannot exceed the original payment amount.", HttpStatusCode.BAD_REQUEST);
    }
    
    return prisma.$transaction(async (tx) => {
      // 1. Reverse the original payment
      await this.reversePayment(dto.originalPaymentId, `Refunded - ${dto.reason || 'No reason specified'}`, dto.userId, dto.tenantId);

      // 2. Create a new negative payment record for the refund
      const refund = await tx.payment.create({
        data: {
          tenantId: dto.tenantId,
          amount: -Math.abs(dto.amount), // Ensure amount is negative
          method: dto.method,
          reference: `Refund for payment ${dto.originalPaymentId}. Reason: ${dto.reason || 'N/A'}`,
          status: "completed",
          transactionId: originalPayment.transactionId,
          purchaseOrderId: originalPayment.purchaseOrderId,
          sessionId: dto.sessionId ?? originalPayment.sessionId,
          userId: dto.userId,
          paidAt: new Date(),
        },
      });

      // 3. Audit and emit event
      await auditService.log({
        tenantId: dto.tenantId,
        userId: dto.userId,
        action: "PAYMENT_REFUND",
        module: "Payment",
        entityId: refund.id,
        details: JSON.stringify({ amount: refund.amount, originalPaymentId: dto.originalPaymentId })
      });

      eventEmitter.emit(paymentEvents.PAYMENT_REFUNDED, { refundId: refund.id, originalPaymentId: dto.originalPaymentId });

      return refund;
    });
  }

  async list(tenantId: string): Promise<PaymentResponseDto[]> {
    const key = this.cacheKey(tenantId);
    const cached = await cacheService.get<PaymentResponseDto[]>(key);
    if (cached) return cached;
    const data = await prisma.payment.findMany({
      where: { tenantId },
      orderBy: { paymentDate: 'desc' },
    });
    await cacheService.set(key, data, 300);
    return data;
  }

  async getPayments(filters: Partial<CreatePaymentDto>) {
    return prisma.payment.findMany({ where: filters });
  }

  async getById(tenantId: string, id: string): Promise<PaymentResponseDto> {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment || payment.tenantId !== tenantId) {
      throw new AppError('Payment not found', 404);
    }
    return payment;
  }

  async updatePayment(id: string, dto: UpdatePaymentDto) {
    return prisma.payment.update({ where: { id }, data: dto });
  }

}

export const paymentService = new PaymentService();
