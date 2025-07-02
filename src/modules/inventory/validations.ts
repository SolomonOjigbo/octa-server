//Inventory validations schema (src/modules/inventory/validation.ts)

import { StockMovementType } from "@common/types/stockMovement.dto";
import { z } from "zod";


// Validation Schemas
export const InventoryMovementSchema = z.object({
  tenantId: z.string().cuid(),
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional(),
  batchNumber: z.string().min(1).optional(),
  quantity: z.number().positive(),
  movementType: z.nativeEnum(StockMovementType),
  source: z.object({
    type: z.enum(['store', 'warehouse', 'supplier']),
    id: z.string()
  }).optional(),
  destination: z.object({
    type: z.enum(['store', 'warehouse', 'customer']),
    id: z.string()
  }).optional(),
  reference: z.string().optional(),
  costPrice: z.number().positive().optional(),
  expiryDate: z.string().datetime().optional(),
  metadata: z.object({
    prescriptionId: z.string().optional(),
    pharmacistId: z.string().optional(),
    temperatureLog: z.object({
      min: z.number(),
      max: z.number(),
      avg: z.number()
    }).optional()
  }).optional()
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




