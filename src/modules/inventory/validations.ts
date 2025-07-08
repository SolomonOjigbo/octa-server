//Inventory validations schema (src/modules/inventory/validation.ts)

import { StockMovementType } from "@common/types/stockMovement.dto";
import { z } from "zod";


// src/modules/inventory/validations.ts

export const InventoryMovementSchema = z.object({
  tenantProductId:        z.string().cuid(),
  tenantProductVariantId: z.string().cuid().optional(),
  quantity:               z.number(),
  costPrice:              z.number().optional(),
  movementType:           z.string().min(1),
  reference:              z.string().optional(),
  batchNumber:            z.string().optional(),
  expiryDate:             z.coerce.date().optional(),
  storeId:                z.string().cuid().optional(),
  warehouseId:            z.string().cuid().optional(),
  temperature:            z.number().optional(),
  isControlled:           z.boolean().optional(),
  requiresRefrigeration:  z.boolean().optional(),
  metadata:               z.record(z.any()).optional(),
});


export const InventoryAdjustmentSchema = z.object({
  tenantId: z.string().cuid(),
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional(),
  batchNumber: z.string().min(1).optional(),
  quantity: z.number(),
  reason: z.enum([
    'damage', 
    'expiry', 
    'discrepancy', 
    'donation',
    'compounding'
  ]),
  location: z.object({
    type: z.enum(['store', 'warehouse']),
    id: z.string()
  }),
  notes: z.string().max(500).optional(),
  metadata: z.object({
    pharmacistId: z.string().optional(),
    witnessId: z.string().optional(), // For controlled substances
    photos: z.array(z.string()).optional() // Damage documentation
  }).optional()
});

export const InventoryQuerySchema = z.object({
  tenantId: z.string().cuid(),
  productId: z.string().cuid().optional(),
  variantId: z.string().cuid().optional(),
  locationType: z.enum(['store', 'warehouse']).optional(),
  locationId: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryThreshold: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

export const ControlledSubstanceMovementSchema = z.object({
  pharmacistId: z.string().cuid(),
  witnessId: z.string().cuid().optional(),
  prescriptionId: z.string().cuid().optional(),
  verificationCode: z.string().length(6).optional(), // For 2-factor verification
  isControlled: z.boolean().optional()
}).refine(data => {
  // If controlled substance, require prescription
  return data.isControlled ? !!data.prescriptionId : true;
}, {
  message: "Prescription required for controlled substances"
});


export const createInventoryMovementSchema = z.object({
  tenantId: z.string().cuid(),
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional(),
  storeId: z.string().cuid().optional(),
  warehouseId: z.string().cuid().optional(),
  batchNumber: z.string().optional(),
  quantity: z.number().int(),
  costPrice: z.number().nonnegative().optional(),
  expiryDate: z.string().datetime().optional(),
  movementType: z.string().min(2),
  reference: z.string().optional(),
});

export const updateInventoryMovementSchema = z.object({
  batchNumber: z.string().optional(),
  quantity: z.number().int().optional(),
  costPrice: z.number().nonnegative().optional(),
  expiryDate: z.string().datetime().optional(),
  movementType: z.string().min(2).optional(),
  reference: z.string().optional(),
});

export type InventoryMovement = z.infer<typeof InventoryMovementSchema>;
export type InventoryAdjustment = z.infer<typeof InventoryAdjustmentSchema>;




