import { z } from "zod";

// Aligned with CreatePaymentDto
export const createPaymentSchema = z.object({
  tenantId: z.string().cuid(),
  amount: z.number().positive("Amount must be a positive number."),
  method: z.string().min(2, "Payment method is required."),
  reference: z.string().optional(),
  status: z.string().optional().default("completed"),
  transactionId: z.string().cuid().optional(),
  purchaseOrderId: z.string().cuid().optional(),
  sessionId: z.string().cuid().optional(),
  userId: z.string().cuid(), // User performing the payment is required
  paidAt: z.string().datetime().optional(),
}).refine(data => data.transactionId || data.purchaseOrderId, {
  message: "A payment must be linked to either a transaction or a purchase order.",
  path: ["transactionId"],
});

// Aligned with UpdatePaymentDto
export const updatePaymentSchema = z.object({
  status: z.string().optional(),
  reference: z.string().optional(),
});

// Aligned with CreateRefundDto
export const createRefundSchema = z.object({
  tenantId: z.string().cuid(),
  originalPaymentId: z.string().cuid(),
  amount: z.number().positive("Refund amount must be positive."),
  method: z.string(),
  reason: z.string().optional(),
  userId: z.string().cuid(), // User processing the refund is required
  sessionId: z.string().cuid().optional(),
});

// For reversing a payment
export const reversePaymentSchema = z.object({
  reason: z.string().min(5, "A reason is required for reversal."),
});