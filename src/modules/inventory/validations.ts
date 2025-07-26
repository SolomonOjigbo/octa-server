
//Inventory validations schema (src/modules/inventory/validation.ts)

import { StockMovementType } from "@common/types/stockMovement.dto";
import { z } from "zod";



export const InventoryMovementSchema = z.object({
  tenantProductId: z.string().min(1),
  globalProductId: z.string().cuid().optional(),
  tenantProductVariantId: z.string().optional(),
  batchNumber: z.string().optional(),
  storeId: z.string().optional(),
  warehouseId: z.string().optional(),
  quantity: z.number().positive().or(z.number().negative()),
  costPrice: z.number().optional(),
  expiryDate: z.coerce.date().optional(),
  movementType: z.nativeEnum(StockMovementType),
  reference: z.string().optional(),
  reason: z.string().optional(),
  metadata: z.record(z.any()).optional()
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

export const VoidInventoryMovementSchema = z.object({
  id: z.string().min(1),
  reason: z.string().min(5, "Please provide a reason for voiding this movement."),
});

export const UpdateInventoryMovementSchema = z.object({
  id: z.string(),
  metadata: z.record(z.any()).optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.coerce.date().optional(),
});

export const InventorySearchSchema = z.object({
  tenantProductId: z.string().cuid().optional(),
  globalProductId: z.string().cuid().optional(),
  tenantProductVariantId: z.string().cuid().optional(),
  storeId: z.string().optional(),
  warehouseId: z.string().optional(),
  movementType: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  voided: z.boolean().optional(),
}).refine(
    (data) =>
      Boolean(data.tenantProductId) !== Boolean(data.globalProductId),
    {
      message:
        "Must provide exactly one of 'tenantProductId' or 'globalProductId'",
      path: ['tenantProductId', 'globalProductId'],
    }
  );
