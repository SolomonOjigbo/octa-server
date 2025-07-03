export type StockTransferStatus = 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled';
export type StockTransferType = 'intra-tenant' | 'cross-tenant';

export interface CreateStockTransferDto {
  tenantId: string;
  fromStoreId?: string;
  fromWarehouseId?: string;
  toTenantId?: string;
  toStoreId?: string;
  toWarehouseId?: string;
  productId: string;
  quantity: number;
  transferType: StockTransferType;
  b2bConnectionId?: string;
  requestedBy: string;
  notes?: string;
  batchNumber?: string;
  expiryDate?: Date;
  isControlled?: boolean;
  pharmacistId?: string;
  temperature?: number;
}

export interface ApproveStockTransferDto {
  approvedBy: string;
  notes?: string;
}

export interface RejectStockTransferDto {
  rejectedBy: string;
  notes?: string;
}

export interface CancelStockTransferDto {
  cancelledBy: string;
  notes?: string;
}

export interface StockTransferResponseDto {
  id: string;
  tenantId: string;
  fromStore?: { id: string; name: string };
  fromWarehouse?: { id: string; name: string };
  toTenant?: { id: string; name: string };
  toStore?: { id: string; name: string };
  toWarehouse?: { id: string; name: string };
  product: { id: string; name: string; sku: string; isControlled: boolean };
  quantity: number;
  transferType: StockTransferType;
  b2bConnection?: { id: string; status: string };
  requestedBy: { id: string; name: string };
  approvedBy?: { id: string; name: string };
  status: StockTransferStatus;
  batchNumber?: string;
  expiryDate?: Date;
  isControlled?: boolean;
  notes?: string;
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