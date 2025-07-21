import { z } from 'zod';

export const RefundItemSchema = z
  .object({
    tenantProductId: z.string().cuid().optional(),
    globalProductId: z.string().cuid().optional(),
    quantity: z.number().int().positive(),
    reason: z.string().optional(),
  })
  .refine(
    (d) => Boolean(d.tenantProductId) !== Boolean(d.globalProductId),
    {
      message:
        "Must provide exactly one of 'tenantProductId' or 'globalProductId'",
      path: ['tenantProductId', 'globalProductId'],
    }
  );

export const CreateRefundDtoSchema = z
  .object({
    transactionId: z.string().cuid().optional(),
    purchaseOrderId: z.string().cuid().optional(),
    refundItems: z.array(RefundItemSchema).min(1),
    refundMethod: z
      .enum(['cash', 'reversal', 'credit', 'store-credit', 'other'])
      .optional(),
    notes: z.string().optional(),
  })
  .refine(
    (d) => Boolean(d.transactionId) || Boolean(d.purchaseOrderId),
    {
      message:
        'Either transactionId or purchaseOrderId must be provided',
      path: ['transactionId', 'purchaseOrderId'],
    }
  );

