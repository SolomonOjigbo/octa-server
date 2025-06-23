export interface InventoryMovementDto {
  tenantId: string;
  productId: string;
  storeId?: string;
  warehouseId?: string;
  quantity: number;
  movementType: string;
  reference?: string; // StockTransfer ID, etc.
}

export interface CreateInventoryMovementDto {
  tenantId: string;
  productId: string;
  storeId?: string;
  warehouseId?: string;
  batchNumber?: string;
  quantity: number;             // Positive (in), negative (out)
  movementType: string;         // e.g., "IN", "OUT", "ADJUST", "TRANSFER", "SALE", "PURCHASE"
  costPrice?: number;
  expiryDate?: Date | string;
  reference?: string;           // e.g., transactionId, purchaseOrderId, stockTransferId
}

export interface UpdateInventoryMovementDto {
  batchNumber?: string;
  quantity?: number;
  movementType?: string;
  costPrice?: number;
  expiryDate?: Date | string;
  reference?: string;
}
export interface InventoryDto {
  id: string;
  tenantId: string;
  productId: string;
  storeId?: string;
  warehouseId?: string;
  batchNumber?: string;
  quantity: number;             // Positive (in), negative (out)
  movementType: string;         // e.g., "IN", "OUT", "ADJUST", "TRANSFER", "SALE", "PURCHASE"
  costPrice?: number;
  expiryDate?: Date | string;
  reference?: string;           // e.g., transactionId, purchaseOrderId, stockTransferId
  createdAt: Date;
  updatedAt: Date;
}