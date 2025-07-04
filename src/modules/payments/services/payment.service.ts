import { PrismaClient } from "@prisma/client";
import { CreatePaymentDto, CreateRefundDto, UpdatePaymentDto } from "../types/payment.dto";
import { auditService } from "../../audit/services/audit.service";

const prisma = new PrismaClient();

export class PaymentService {
  async createPayment(dto: CreatePaymentDto) {
    // You may wish to validate amount, linkage to transaction/purchaseOrder here
    return prisma.payment.create({ data: dto });
  }

  async getPayments(filters: Partial<CreatePaymentDto>) {
    return prisma.payment.findMany({ where: filters });
  }

  async updatePayment(id: string, dto: UpdatePaymentDto) {
    return prisma.payment.update({ where: { id }, data: dto });
  }

   // Mark a payment as reversed
async reversePayment(id: string, reason?: string, userId?: string, tenantId?: string) {
  const payment = await prisma.payment.update({
    where: { id },
    data: {
      status: "reversed",
      reference: reason ? `Reversed: ${reason}` : "Reversed",
    },
  });
  // log audit
  if (tenantId)
    await auditService.log({
      tenantId,
      userId,
      action: "PAYMENT_REVERSAL",
      entityType: "Payment",
      entityId: id,
      // details: { reason, payment }, // Removed invalid property
    });
  return payment;
}

  // Create a refund payment (links to original payment, marks original as reversed)
  async createRefund(dto: CreateRefundDto) {
  // Reverse original payment
  await this.reversePayment(dto.originalPaymentId, dto.reason, dto.userId, dto.tenantId);

  // Create negative payment (refund)
  const original = await prisma.payment.findUnique({ where: { id: dto.originalPaymentId } });
  const refund = await prisma.payment.create({
    data: {
      tenantId: dto.tenantId,
      amount: -Math.abs(dto.amount),
      method: dto.method,
      reference: dto.reason ? `Refund: ${dto.reason}` : "Refund",
      status: "completed",
      transactionId: dto.transactionId ?? original?.transactionId,
      purchaseOrderId: dto.purchaseOrderId ?? original?.purchaseOrderId,
      sessionId: dto.sessionId ?? original?.sessionId,
      userId: dto.userId,
      paidAt: new Date(),
    },
  });
  // log audit
  await auditService.log({
    tenantId: dto.tenantId,
    userId: dto.userId,
    action: "REFUND",
    entityType: "Payment",
    entityId: refund.id,
  });
  return refund;
}
}

export const paymentService = new PaymentService();
