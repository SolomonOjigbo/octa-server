import { z } from "zod";

// Aligned with OpenPOSSessionDto
export const openPOSSessionSchema = z.object({
  tenantId: z.string().cuid(),
  storeId: z.string().cuid(),
  userId: z.string().cuid(),
  openingBalance: z.number().nonnegative(),
});

// Aligned with ClosePOSSessionDto
export const closePOSSessionSchema = z.object({
  sessionId: z.string().cuid(),
  closingBalance: z.number().nonnegative(),
  closedAt: z.string().datetime().optional(), // Input from API is a string
  closedBy: z.string().cuid().optional(),
});

// Aligned with CreatePOSTransactionDto and its item sub-dto
export const createPOSTransactionItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  taxRate: z.number().nonnegative().optional(),
});

export const createPOSTransactionSchema = z.object({
  tenantId: z.string().cuid(),
  storeId: z.string().cuid(),
  userId: z.string().cuid(),
  customerId: z.string().cuid().optional(),
  pharmacistId: z.string().cuid().optional(),
  items: z.array(createPOSTransactionItemSchema).min(1),
  discount: z.number().nonnegative().optional(),
  taxAmount: z.number().nonnegative().optional(), // Note: Often calculated on the backend
  paymentMethod: z.string(),
  sessionId: z.string().cuid(),
  shippingType: z.enum(["pickup", "delivery"]).optional(),
  shippingFee: z.number().nonnegative().optional(),
  shippingAddress: z.string().optional(),
});

// Aligned with CreatePOSPaymentDto
export const createPOSPaymentSchema = z.object({
  tenantId: z.string().cuid(),
  transactionId: z.string().cuid(),
  amount: z.number().positive(),
  method: z.string(),
  reference: z.string().optional(),
  processedBy: z.string().cuid(),
});

// Aligned with CreateSalesReturnDto
export const createSalesReturnSchema = z.object({
  tenantId: z.string().cuid(),
  originalTransactionId: z.string().cuid(),
  userId: z.string().cuid(),
  sessionId: z.string().cuid(),
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        quantity: z.number().int().positive(),
        reason: z.string().min(5, { message: "Return reason is required." }),
      })
    )
    .min(1),
  refundMethod: z.string(),
});

// Aligned with CreateCashDropDto
export const createCashDropSchema = z.object({
  tenantId: z.string().cuid(),
  storeId: z.string().cuid(),
  sessionId: z.string().cuid(),
  userId: z.string().cuid(),
  amount: z.number().positive(),
  reason: z.string().optional(),
});

// Schema for the cash reconciliation endpoint
export const reconcileCashSchema = z.object({
  declaredClosingCash: z.number().nonnegative(),
});