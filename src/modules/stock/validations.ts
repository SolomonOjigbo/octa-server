// Stock module validation schemas
// @modules/stock/validations.ts
import { StockMovementType } from "@common/types/stockMovement.dto";
import { z } from "zod";

export const StockAdjustmentSchema = z.object({
  tenantId: z.string().cuid(),
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional(),
  storeId: z.string().cuid().optional(),
  warehouseId: z.string().cuid().optional(),
  quantity: z.number().int().nonnegative(),
  reason: z.string().min(5).max(255).optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
  movementType: z.nativeEnum(StockMovementType).optional(),
  reference: z.string().optional(),
  initiatedBy: z.string().optional() // Prescriber ID for controlled substances
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



