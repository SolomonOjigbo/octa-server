
// src/modules/purchaseOrder/validations.ts
import { PaymentStatus } from '@modules/transactions/types/transaction.dto';
import { z } from 'zod';

/**
 * Line‐item: exactly one of tenantProductId | globalProductId
 */
export const PurchaseOrderItemSchema = z
  .object({
    tenantProductId: z.string().cuid().optional(),
    globalProductId: z.string().cuid().optional(),
    tenantProductVariantId: z.string().cuid().optional(),
    quantity: z.number().int().min(1),
    costPrice: z.number().min(0),
    batchNumber: z.string().optional(),
    expiryDate: z.coerce.date().optional(),
  })
  .refine(
    (data) =>
      Boolean(data.tenantProductId) !== Boolean(data.globalProductId),
    {
      message:
        "Must provide exactly one of 'tenantProductId' or 'globalProductId'",
      path: ['tenantProductId', 'globalProductId'],
    }
  );


export const CreatePurchaseOrderSchema = z.object({
  supplierId: z.string().cuid(),
  storeId: z.string().cuid().optional(),
  warehouseId: z.string().cuid().optional(),
  orderDate: z.coerce.date(),
  receivedDate: z.coerce.date().optional(),
  totalAmount: z.number().min(0),
  status: z.enum(['pending', 'approved', 'received', 'cancelled']).default('pending'),
  userId: z.string().cuid(),
  notes: z.string().optional(),
  items: z.array(PurchaseOrderItemSchema).min(1),
});

export const UpdatePurchaseOrderSchema = z.object({
  status: z
    .enum(['pending', 'approved', 'received', 'cancelled'])
    .optional(),
  receivedDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const CancelPurchaseOrderSchema = z
  .object({ reason: z.string().optional() })
  .partial();

export const LinkPaymentSchema = z.object({
  paymentId: z.string().cuid(),
  amount: z.number().min(0),
  paymentMethod: z.string().optional(),
  status: z.nativeEnum(PaymentStatus)
});
