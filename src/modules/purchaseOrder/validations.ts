import { z } from "zod";

// Item validation
export const createPurchaseOrderItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive(),
  costPrice: z.number().nonnegative(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
});

// PO validation
export const createPurchaseOrderSchema = z.object({
  tenantId: z.string().cuid(),
  supplierId: z.string().cuid(),
  storeId: z.string().cuid().optional(),
  warehouseId: z.string().cuid().optional(),
  orderDate: z.string().datetime(),
  items: z.array(createPurchaseOrderItemSchema).min(1),
  totalAmount: z.number().nonnegative(),
  notes: z.string().optional(),
});

export const updatePurchaseOrderSchema = z.object({
  status: z.enum(["pending", "approved", "received", "cancelled"]).optional(),
  receivedDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const cancelPurchaseOrderSchema = z.object({
  cancelledBy: z.string().cuid(),
  reason: z.string().optional(),
});

export const linkPaymentSchema = z.object({
  paymentId: z.string().cuid(),
  amount: z.number().nonnegative(),
});
