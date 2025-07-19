// @modules/stock/validations.ts
import { StockMovementType } from "@common/types/stockMovement.dto";
import { z } from 'zod';

export const AdjustProductStockSchema = z.object({
  tenantProductId: z.string().cuid(),
  tenantProductVariantId: z.string().optional(),
  storeId: z.string().cuid().optional(),
  warehouseId: z.string().cuid().optional(),

  quantity: z
    .number()
    .int()
    .refine((q) => q !== 0, { message: "Quantity must be non-zero." }),

  reference: z.string().min(3).optional(),
  movementType: z.nativeEnum(StockMovementType).optional(),
  batchNumber: z.string().optional(),
  expiryDate: z
    .string()
    .transform((s) => new Date(s))
    .optional()
    .refine((d) => d > new Date(), {
      message: "expiryDate must be in the future.",
    }),
});


export const VariantStockAdjustmentSchema = z.object({
  tenantProductId:       z.string().cuid(),
  tenantProductVariantId: z.string().cuid(),
  storeId:               z.string().optional(),
  warehouseId:           z.string().optional(),
  quantity:              z.number().int(),
  reason:                z.string().min(5).max(255).optional(),
  movementType:           z.nativeEnum(StockMovementType).optional(),
  reference:             z.string().optional(),
  batchNumber:           z.string().optional(),
   expiryDate: z
    .string()
    .transform((s) => new Date(s))
    .optional()
    .refine((d) => d > new Date(), {
      message: "expiryDate must be in the future.",
    }),
});


export const StockIncrementSchema = z.object({
  tenantId: z.string().cuid(),
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional(),
  storeId: z.string().cuid().optional(),
  warehouseId: z.string().cuid().optional(),
  delta: z.number().int(),
  reason: z.string().min(5).max(255).optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
  movementType: z.nativeEnum(StockMovementType).optional(),
  reference: z.string().optional(),
});



