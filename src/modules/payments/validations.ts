import { z } from 'zod';

// in validations.ts
export const RefundPaymentSchema = z.object({
  amount: z.number().min(0).optional(),    // if partial refund
  reason: z.string().optional(),
});

export const ReversePaymentSchema = z.object({
  reason: z.string().optional(),
});


export const createPaymentSchema = z.object({
  tenantId:       z.string().cuid(),
  customerId:      z.string().cuid().optional(),             // �� add
  purchaseOrderId: z.string().cuid().optional(),
  transactionId:   z.string().cuid().optional(),
  sessionId:       z.string().cuid().optional(),             // ← add
  amount:          z.number().min(0),
  method:          z.string().min(1),
  reference:       z.string().optional(),
  status:          z.enum(['pending','completed','failed','refunded','cancelled']).default('pending'),
  paidAt:          z.coerce.date().optional(),               // ← add
  userId:          z.string().cuid().optional(),             // rarely user‐supplied, but reflect Prisma
});

export const updatePaymentSchema = z.object({
  amount:    z.number().min(0).optional(),
  method:    z.string().min(1).optional(),
  reference: z.string().optional(),
  status:    z.enum(['pending','completed','failed','refunded','cancelled']).optional(),
  paidAt:    z.coerce.date().optional(),                     // ← add
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