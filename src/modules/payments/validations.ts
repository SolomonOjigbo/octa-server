// src/modules/payment/validations.ts
import { z } from 'zod';
import {
  PaymentReferenceType,
  PaymentStatus
} from '@prisma/client';

export const CreatePaymentSchema = z.object({
  amount:          z.number().min(0),
  method:          z.string(),
  reference:       z.string().optional(),
  status:          z.nativeEnum(PaymentStatus).default(PaymentStatus.UNPAID),
  referenceType:   z.nativeEnum(PaymentReferenceType).optional(),
  transactionId:   z.string().cuid().optional(),
  purchaseOrderId: z.string().cuid().optional(),
  invoiceId:       z.string().cuid().optional(),
  sessionId:       z.string().cuid().optional(),
  userId:          z.string().cuid().optional(),
  paymentDate:     z.coerce.date().optional(),
});

export const UpdatePaymentSchema = CreatePaymentSchema.partial();










export const RefundPaymentSchema = z.object({
  amount: z.number().min(0).optional(),    // if partial refund
  reason: z.string().optional(),
});

export const ReversePaymentSchema = z.object({
  reason: z.string().optional(),
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