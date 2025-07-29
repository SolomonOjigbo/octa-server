// src/modules/stockTransfer/validations.ts
import { z } from 'zod';

const StatusEnum = z.enum(['PENDING', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED']);
const TransferTypeEnum = z.enum(['INTRA_TENANT', 'CROSS_TENANT']);

export const StockTransferItemSchema = z.object({
  sourceTenantProductId: z.string().cuid(),
  sourceTenantProductVariantId: z.string().cuid().optional(),
  destTenantProductId: z.string().cuid(),
  destTenantProductVariantId: z.string().cuid().optional(),
  quantity: z.number().int().min(1),
  batchNumber: z.string().optional(),
  expiryDate: z.coerce.date().optional(),
});

export const CreateStockTransferSchema = z.object({
  fromStoreId: z.string().cuid().optional(),
  fromWarehouseId: z.string().cuid().optional(),
  destTenantId: z.string().cuid(),
  toStoreId: z.string().cuid().optional(),
  toWarehouseId: z.string().cuid().optional(),
  transferType: TransferTypeEnum,
  items: z.array(StockTransferItemSchema).min(1),
});

export const ApproveStockTransferSchema = z.object({
  reason: z.string().optional(),
});

export const RejectStockTransferSchema = z.object({
  reason: z.string().min(5, "Rejection reason is required"),
});

export const CancelStockTransferSchema = z.object({
  reason: z.string().min(5).optional(),
});

export const ListStockTransfersSchema = z.object({
  tenantId: z.string().cuid().optional(),
  destTenantId: z.string().cuid().optional(),
  status: StatusEnum.optional(),
  storeId: z.string().cuid().optional(),
  warehouseId: z.string().cuid().optional(),
  productId: z.string().cuid().optional(),
  transferType: TransferTypeEnum.optional(),
  createdById: z.string().cuid().optional(),
  approvedById: z.string().cuid().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});