// src/modules/stockTransfer/validations.ts
import { z } from 'zod';

export const CreateStockTransferSchema = z.object({
  sourceTenantProductId: z.string().cuid(),
  sourceTenantProductVariantId: z.string().cuid().optional(),
  fromStoreId: z.string().cuid().optional(),
  fromWarehouseId: z.string().cuid().optional(),
  destTenantId: z.string().cuid(),
  destTenantProductId: z.string().cuid(),
  destTenantProductVariantId: z.string().cuid().optional(),
  toStoreId: z.string().cuid().optional(),
  toWarehouseId: z.string().cuid().optional(),
  quantity: z.number().int().min(1),
  batchNumber: z.string().optional(),
  expiryDate: z.coerce.date().optional(),
  transferType: z.enum(['intra-tenant','cross-tenant']),
});

export const ApproveStockTransferSchema = z.object({
  reason: z.string().optional(),
});

export const RejectStockTransferSchema = z.object({
  reason: z.string().optional(),
});

export const CancelStockTransferSchema = z.object({
  reason: z.string().optional(),
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