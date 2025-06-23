import { z } from "zod";

export const createInventoryMovementSchema = z.object({
  tenantId: z.string().cuid(),
  productId: z.string().cuid(),
  storeId: z.string().cuid().optional(),
  warehouseId: z.string().cuid().optional(),
  batchNumber: z.string().optional(),
  quantity: z.number().int(), // Positive or negative
  movementType: z.string().min(2),
  costPrice: z.number().optional(),
  expiryDate: z.string().datetime().optional(),
  reference: z.string().optional(),
});

export const updateInventoryMovementSchema = createInventoryMovementSchema.partial();
