// src/modules/stockTransfer/types/stockTransfer.dto.ts
export type StockTransferStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type StockTransferType = 
  | 'INTRA_TENANT'
  | 'CROSS_TENANT';

export interface StockTransferItemDto {
  sourceTenantProductId: string;
  sourceTenantProductVariantId?: string;
  tenantProductId: string;
  destTenantProductVariantId?: string;
  quantity: number;
  batchNumber?: string;
  expiryDate?: Date;
  name: string;
  sku: string;
}

export interface CreateStockTransferDto {
  fromStoreId?: string;
  fromWarehouseId?: string;
  destTenantId: string;
  toStoreId?: string;
  toWarehouseId?: string;
  transferType: StockTransferType;
  items: StockTransferItemDto[];
}

export interface ApproveStockTransferDto { 
  reason?: string;
}

export interface RejectStockTransferDto {
  reason?: string;
}

export interface CancelStockTransferDto {
  reason?: string;
}

export interface StockTransferResponseDto {
  id: string;
  tenantId: string;
  fromStoreId?: string;
  fromWarehouseId?: string;
  destTenantId: string;
  toStoreId?: string;
  toWarehouseId?: string;
  status: StockTransferStatus;
  transferType: StockTransferType;
  createdById?: string;
  approvedById?: string;
  createdAt: Date;
  updatedAt: Date;
  items: StockTransferItemDto[];
}