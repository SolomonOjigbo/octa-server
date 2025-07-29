// src/modules/inventory/validations.ts
import { StockMovementType } from "@common/types/stockMovement.dto";
import { z } from "zod";

export const StockMovementTypeSchema = z.nativeEnum(StockMovementType);

export const InventoryMovementSchema = z.object({
  tenantProductId: z.string().min(1).optional(),
  globalProductId: z.string().cuid().optional(),
  tenantProductVariantId: z.string().optional(),
  batchNumber: z.string().optional(),
  storeId: z.string().optional(),
  warehouseId: z.string().optional(),
  quantity: z.number().refine(q => q !== 0, "Quantity cannot be zero"),
  costPrice: z.number().optional(),
  expiryDate: z.coerce.date().optional(),
  movementType: StockMovementTypeSchema,
  reference: z.string().optional(),
  reason: z.string().optional(),
  metadata: z.record(z.any()).optional()
}).refine(
  data => Boolean(data.tenantProductId) !== Boolean(data.globalProductId),
  {
    message: "Must provide exactly one of 'tenantProductId' or 'globalProductId'",
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
  movementType: StockMovementTypeSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  voided: z.boolean().optional(),
}).refine(
  data => Boolean(data.tenantProductId) !== Boolean(data.globalProductId),
  {
    message: "Must provide exactly one of 'tenantProductId' or 'globalProductId'",
    path: ['tenantProductId', 'globalProductId'],
  }
);

export const ReserveStockSchema = z.object({
  tenantId: z.string().cuid(),
  transferId: z.string().cuid(),
  items: z.array(z.object({
    tenantProductId: z.string().cuid(),
    tenantProductVariantId: z.string().cuid().optional(),
    warehouseId: z.string().cuid().optional(),
    storeId: z.string().cuid().optional(),
    quantity: z.number().positive()
  })).min(1)
});

export const ReleaseReservationSchema = z.object({
  tenantId: z.string().cuid(),
  transferId: z.string().cuid()
});

export const CheckAvailabilitySchema = z.object({
  tenantId: z.string().cuid(),
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional(),
  quantity: z.number().positive(),
  warehouseId: z.string().cuid().optional(),
  storeId: z.string().cuid().optional()
});