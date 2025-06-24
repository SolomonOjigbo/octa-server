import { z } from "zod";

export const createPaymentSchema = z.object({
  tenantId: z.string().cuid(),
  amount: z.number().positive(),
  method: z.string().min(2),
  reference: z.string().optional(),
  status: z.string().optional(),
  transactionId: z.string().cuid().optional(),
  purchaseOrderId: z.string().cuid().optional(),
  sessionId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  paidAt: z.string().datetime().optional(),
});

export const updatePaymentSchema = z.object({
  status: z.string().optional(),
  paidAt: z.string().datetime().optional(),
  reference: z.string().optional(),
});

// Validation
export const createRefundSchema = z.object({
  tenantId: z.string().cuid(),
  originalPaymentId: z.string().cuid(),
  amount: z.number().positive(),
  method: z.string(),
  reason: z.string().optional(),
  transactionId: z.string().cuid().optional(),
  purchaseOrderId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  sessionId: z.string().cuid().optional(),
});

export const reversePaymentSchema = z.object({
  reason: z.string().optional(),
});