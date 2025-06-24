import { z } from "zod";

export const openPOSSessionSchema = z.object({
  tenantId: z.string().cuid(),
  storeId: z.string().cuid(),
  userId: z.string().cuid(),
  openingBalance: z.number().nonnegative(),
});

export const closePOSSessionSchema = z.object({
  sessionId: z.string().cuid(),
  closingBalance: z.number(),
  closedAt: z.string().datetime().optional(),
});


export const createPOSTransactionItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  discount: z.number().nonnegative().optional(),
  taxRate: z.number().nonnegative().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
});

export const createPOSTransactionSchema = z.object({
  tenantId: z.string().cuid(),
  storeId: z.string().cuid(),
  userId: z.string().cuid(),
  customerId: z.string().cuid().optional(),
  items: z.array(createPOSTransactionItemSchema).min(1),
  discount: z.number().nonnegative().optional(),
  taxAmount: z.number().nonnegative().optional(),
  paymentMethod: z.string(),
  totalAmount: z.number().nonnegative().optional(),
  sessionId: z.string().cuid(),
  shippingType: z.enum(["pickup", "delivery"]).optional(),
  shippingFee: z.number().nonnegative().optional(),
  shippingAddress: z.string().optional(),
});


export const createPOSPaymentSchema = z.object({
  tenantId: z.string().cuid(),
  transactionId: z.string().cuid(),
  amount: z.number().nonnegative(),
  method: z.string(),
  reference: z.string().optional(),
});

export const createSalesReturnSchema = z.object({
  tenantId: z.string().cuid(),
  originalTransactionId: z.string().cuid(),
  userId: z.string().cuid(),
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      quantity: z.number().int().positive(),
      reason: z.string().optional(),
    })
  ).min(1),
  refundMethod: z.string(),
  sessionId: z.string().cuid(),
});

export const createCashDropSchema = z.object({
  tenantId: z.string().cuid(),
  storeId: z.string().cuid(),
  sessionId: z.string().cuid(),
  userId: z.string().cuid(),
  amount: z.number().positive(),
  reason: z.string().optional(),
});
