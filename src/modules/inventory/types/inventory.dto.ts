
// src/modules/inventory/types/inventory.dto.ts
import { StockMovementType } from "@common/types/stockMovement.dto";

export interface InventoryMovementDto {
  tenantProductId?: string;
  globalProductId?: string;
  tenantProductVariantId?: string;
  storeId?: string;
  warehouseId?: string;
  batchNumber?: string;
  name?: string;
  sku?: string;
  quantity: number;
  costPrice?: number;
  expiryDate?: Date;
  movementType: StockMovementType;
  reference?: string;
  reason?: string;
  metadata?: any;
}

export interface UpdateInventoryMovementDto extends Partial<InventoryMovementDto> {}

export interface BaseItem {
  tenantProductId?: string;
  globalProductId?: string;
  tenantProductVariantId?: string;
  storeId?: string;
  name: string;
  sku: string;
  warehouseId?: string;
  costPrice?: number;
  batchNumber?: string;
  expiryDate?: Date;
  quantity: number;
  reason?: string;
  reference: string;
  metadata?: Record<string, any>;
}

export interface ReserveStockDto {
  tenantId: string;
  transferId: string;
  items: Array<{
    tenantProductId: string;
    tenantProductVariantId?: string;
    warehouseId?: string;
    storeId?: string;
    quantity: number;
  }>;
}

export interface ReleaseReservationDto {
  tenantId: string;
  transferId: string;
}

export interface CheckAvailabilityDto {
  tenantId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  warehouseId?: string;
  storeId?: string;
}