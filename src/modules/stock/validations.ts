import { z } from "zod";

export const adjustStockSchema = z.object({
  tenantId: z.string().cuid(),
  productId: z.string().cuid(),
  storeId: z.string().cuid().optional(),
  warehouseId: z.string().cuid().optional(),
  quantity: z.number().int().nonnegative(),
});

export const incrementStockSchema = z.object({
  tenantId: z.string().cuid(),
  productId: z.string().cuid(),
  storeId: z.string().cuid().optional(),
  warehouseId: z.string().cuid().optional(),
  delta: z.number().int(),
});
