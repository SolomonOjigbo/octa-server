import { Prisma, PrismaClient } from "@prisma/client";
import { CreatePaymentDto, CreateRefundDto, UpdatePaymentDto } from "../types/payment.dto";
import { auditService } from "../../audit/services/audit.service";
import { AppError, ErrorCode } from "@common/constants/app.errors";
import { HttpStatusCode } from "@common/constants/http";
import { eventEmitter } from "@events/event.emitter";
import { cacheService } from "@cache/cache.service";
import { logger } from "@logging/logger";
import { paymentEvents } from "@events/types/paymentEvents.dto";

const prisma = new PrismaClient();

export class PaymentService {
  /**
   * Creates a payment and updates the related transaction or purchase order.
   */
  async createPayment(dto: CreatePaymentDto) {
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
        tenantId: dto.tenantId,
        userId: dto.userId,
        action: "PAYMENT_CREATE",
        entityType: "Payment",
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
        entityType: "Payment",
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
        entityType: "Payment",
        entityId: refund.id,
        details: JSON.stringify({ amount: refund.amount, originalPaymentId: dto.originalPaymentId })
      });

      eventEmitter.emit(paymentEvents.PAYMENT_REFUNDED, { refundId: refund.id, originalPaymentId: dto.originalPaymentId });

      return refund;
    });
  }

  async getPayments(filters: Partial<CreatePaymentDto>) {
    return prisma.payment.findMany({ where: filters });
  }

  async updatePayment(id: string, dto: UpdatePaymentDto) {
    return prisma.payment.update({ where: { id }, data: dto });
  }
}

export const paymentService = new PaymentService();
