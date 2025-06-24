export interface AdjustStockDto {
  tenantId: string;
  productId: string;
  storeId?: string;
  warehouseId?: string;
  quantity: number; // Final quantity to set (absolute)
  delta?: number; // Optional, used for delta adjustments
}

export interface IncrementStockDto {
  tenantId: string;
  productId: string;
  storeId?: string;
  warehouseId?: string;
  delta: number; // Change in quantity (+/-)
}

export interface DecrementStockDto {
  tenantId: string;
  productId: string;
  storeId?: string;
  warehouseId?: string;
  delta: number; // Change in quantity (+/-)
}