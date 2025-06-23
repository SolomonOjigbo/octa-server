// modules/stockTransfer/types/stockTransfer.dto.ts

export interface CreateStockTransferDto {
  tenantId: string; // Initiator
  fromStoreId?: string;
  fromWarehouseId?: string;
  toTenantId: string; // Receiver
  toStoreId?: string;
  toWarehouseId?: string;
  productId: string;
  quantity: number;
  transferType: "intra-tenant" | "cross-tenant";
  b2bConnectionId?: string;
  requestedBy: string;
  notes?: string;
  delta?: number; // Optional, used for delta transfers
  status?: "pending" | "approved" | "completed"; // Default is pending
}
export interface ApproveStockTransferDto {
  id: string;
  approvedBy: string;
}
export interface CompleteStockTransferDto {
  id: string;
}
export interface ListPendingTransfersDto {
  storeId: string;
}