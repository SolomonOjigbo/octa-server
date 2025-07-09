// src/modules/stockTransfer/types/stockTransfer.dto.ts
export type StockTransferStatus = 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled';
export type StockTransferType = 'intra-tenant' | 'cross-tenant';




export interface CreateStockTransferDto {
  sourceTenantProductId: string;
  sourceTenantProductVariantId?: string;
  fromStoreId?: string;
  fromWarehouseId?: string;
  destTenantId: string;
  destTenantProductId: string;
  destTenantProductVariantId?: string;
  toStoreId?: string;
  toWarehouseId?: string;
  quantity: number;
  batchNumber?: string;
  expiryDate?: Date;
  transferType: StockTransferType;
}

export interface ApproveStockTransferDto extends CreateStockTransferDto { 
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
  sourceTenantProductId: string;
  sourceTenantProductVariantId?: string;
  fromStoreId?: string;
  fromWarehouseId?: string;
  destTenantId: string;
  destTenantProductId: string;
  destTenantProductVariantId?: string;
  toStoreId?: string;
  toWarehouseId?: string;
  quantity: number;
  batchNumber?: string;
  expiryDate?: Date;
  transferType: StockTransferType;
  status: StockTransferStatus;
  createdById?: string;
  approvedById?: string;
  createdAt: Date;
  updatedAt: Date;
}


export interface ListStockTransfersDto {
  tenantId?: string;
  toTenantId?: string;
  status?: string;
  storeId?: string;
  warehouseId?: string;
  productId?: string;
  transferType?: string;
  requestedBy?: string;
  approvedBy?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}