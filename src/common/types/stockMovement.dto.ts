// src/common/types/stockMovement.dto.ts
export enum StockMovementType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  RETURN = 'RETURN',
  WASTAGE = 'WASTAGE',
  EXPIRE = 'EXPIRE',
  DAMAGE = 'DAMAGE',
  RECALL = 'RECALL',
  COMPOUNDING = 'COMPOUNDING',
  DONATION = 'DONATION',
  SAMPLES = 'SAMPLES'
}

export interface StockMovementEvent {
  tenantId: string;
  productId: string;
  variantId?: string;
  storeId?: string;
  warehouseId?: string;
  quantity: number;
  movementType: StockMovementType;
  reference?: string;
  batchNumber?: string;
  expiryDate?: Date;
  userId?: string;
  metadata?: {
    prescriptionId?: string;
    temperature?: number;
    lotNumber?: string;
    previousQuantity?: number;
    newQuantity?: number;
    reason?: string;
  };
}