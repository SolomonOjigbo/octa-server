// Stock module validation schemas
// @modules/stock/validations.ts
import { StockMovementType } from "@common/types/stockMovement.dto";
import { z } from 'zod';

export const StockAdjustmentSchema = z.object({
  tenantProductId:       z.string().cuid(),
  tenantProductVariantId:z.string().cuid().optional(),
  storeId:               z.string().optional(),
  warehouseId:           z.string().optional(),
  quantity:              z.number().int(),
  reason:                z.string().optional(),
  movementType:          z.string().optional(),
  reference:             z.string().optional(),
  batchNumber:           z.string().optional(),
  expiryDate:            z.string().datetime().optional(),
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



