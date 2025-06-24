import { PrismaClient } from "@prisma/client";
import { CreatePaymentDto, CreateRefundDto, UpdatePaymentDto } from "../types/payment.dto";

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
  async reversePayment(id: string, reason?: string) {
    return prisma.payment.update({
      where: { id },
      data: {
        status: "reversed",
        reference: reason ? `Reversed: ${reason}` : "Reversed",
      },
    });
  }

  // Create a refund payment (links to original payment, marks original as reversed)
  async createRefund(dto: CreateRefundDto) {
    // Reverse original payment
    await this.reversePayment(dto.originalPaymentId, dto.reason);

    // Create negative payment (refund)
    const original = await prisma.payment.findUnique({ where: { id: dto.originalPaymentId } });
    return prisma.payment.create({
      data: {
        tenantId: dto.tenantId,
        amount: -Math.abs(dto.amount), // Negative for refund
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
  }
}

export const paymentService = new PaymentService();
