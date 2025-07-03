import { z } from "zod";

// Validation Schemas
export const createStockTransferSchema = z.object({
  tenantId: z.string().cuid(),
  productId: z.string().cuid(),
  quantity: z.number().min(1), // ✅ REQUIRED!
  transferType: z.enum(['intra-tenant', 'cross-tenant']),
  requestedBy: z.string().cuid(),
  fromStoreId: z.string().optional(),
  fromWarehouseId: z.string().optional(),
  toTenantId: z.string().optional(),
  toStoreId: z.string().optional(),
  toWarehouseId: z.string().optional(),
  b2bConnectionId: z.string().optional(),
  notes: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.coerce.date().optional(),
  isControlled: z.boolean().optional(),
  pharmacistId: z.string().optional(),
  temperature: z.number().optional(),
});

export const updateStockTransferSchema = z.object({
  id: z.string().cuid(),
  tenantId: z.string().cuid(),
  fromStoreId: z.string().optional(),
  fromWarehouseId: z.string().optional(),
  toTenantId: z.string().optional(),
  toStoreId: z.string().optional(),
  toWarehouseId: z.string().optional(),
  productId: z.string().cuid(),
  quantity: z.number().min(1).optional(), // ✅ REQUIRED!
  transferType: z.enum(['intra-tenant', 'cross-tenant']).optional(),
  b2bConnectionId: z.string().optional(),
  notes: z.string().max(500).optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.coerce.date().optional(),
  isControlled: z.boolean().optional(),
});


export const approveStockTransferSchema = z.object({
  approvedBy: z.string().cuid(),
  notes: z.string().max(500).optional()
});

export const rejectStockTransferSchema = z.object({
  rejectedBy: z.string().cuid(),
  notes: z.string().max(500).optional()
});

export const cancelStockTransferSchema = z.object({
  cancelledBy: z.string().cuid(),
  notes: z.string().max(500).optional()
});

export const listStockTransfersSchema = z.object({
  tenantId: z.string().cuid().optional(),
  toTenantId: z.string().cuid().optional(),
  status: z.enum(["pending", "approved", "completed", "rejected", "cancelled"]).optional(),
  storeId: z.string().cuid().optional(),
  warehouseId: z.string().cuid().optional(),
  productId: z.string().cuid(),
  transferType: z.enum(["intra-tenant", "cross-tenant"]).optional(),
  requestedBy: z.string().cuid().optional(),
  approvedBy: z.string().cuid().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});