

export interface AdjustStockDto {
  tenantProductId: string;
  tenantProductVariantId?: string;
  storeId?: string;
  warehouseId?: string;
  quantity: number;
  reason?: string;
  movementType?: string;
  reference?: string;
  batchNumber?: string;
  expiryDate?: Date;
}

export interface StockLevelDto {
  id: string;
  tenantId: string;
  tenantProductId: string;
  tenantProductVariantId?: string;
  storeId?: string;
  warehouseId?: string;
  quantity: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderPoint?: number;
  updatedAt: Date;
}


export interface StockResponseDto extends StockLevelDto {
  product: {
    id: string;
    name: string;
    sku: string;
    sellingPrice?: number;
    isPrescription?: boolean;
    controlledSubstance?: boolean;
  };
  variant?: {
    id: string;
    name: string;
    sku: string;
    sellingPrice?: number;
  };
  store?: {
    id: string;
    name: string;
    type?: string;
  };
  warehouse?: {
    id: string;
    name: string;
  };
}

export interface IncrementStockDto {
  tenantId: string;
  productId: string;
  storeId?: string;
  warehouseId?: string;
  delta: number; // Change in quantity (+/-)
}