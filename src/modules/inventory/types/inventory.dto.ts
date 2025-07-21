// // src/modules/inventory/types/inventory.dto.ts
// import { StockMovementType } from "@common/types/stockMovement.dto";

import { z } from "zod";
import { InventoryMovementSchema } from "../validations";

export interface InventoryMovementDto {
  tenantProductId?: string;
  globalProductId?: string;
  tenantProductVariantId?: string;
  storeId?: string;
  warehouseId?: string;
  batchNumber?: string;
  quantity: number;
  costPrice?: number;
  expiryDate?: Date;
  movementType: string;
  reference?: string;
  metadata?: any;
}

export interface UpdateInventoryMovementDto extends Partial<InventoryMovementDto> {}



export interface BaseItem {
  tenantProductId?: string;
  globalProductId?: string;
  tenantProductVariantId?: string;
  storeId?: string;
  warehouseId?: string;
  costPrice?: number;
  batchNumber?: string;
  expiryDate?: Date;
  quantity: number;
  reason?: string;
  reference: string;
  metadata?: any;
}