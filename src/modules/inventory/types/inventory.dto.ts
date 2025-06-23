export interface InventoryMovementDto {
  tenantId: string;
  productId: string;
  storeId?: string;
  warehouseId?: string;
  quantity: number;
  movementType: string;
  reference?: string; // StockTransfer ID, etc.
}