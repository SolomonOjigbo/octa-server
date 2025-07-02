

import { z } from "zod";
import { StockAdjustmentSchema, StockIncrementSchema } from "../validations";

export interface StockLevelDto {
  id: string;
  tenantId: string;
  productId: string;
  variantId?: string;
  storeId?: string;
  warehouseId?: string;
  quantity: number;
  updatedAt: Date;
  reorderPoint?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  locationType?: 'store' | 'warehouse' | 'clinic';
  isCritical?: boolean; // For controlled substances
  requiresPrescription?: boolean;
  controlledSubstance?: boolean;
  lotControlled?: boolean; // For vaccine tracking
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

export type StockAdjustmentDto = z.infer<typeof StockAdjustmentSchema>;
export type StockIncrementDto = z.infer<typeof StockIncrementSchema>;


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

export interface StockFilterOptions {
  productId?: string;
  variantId?: string;
  storeId?: string;
  warehouseId?: string;
  minQuantity?: number;
  maxQuantity?: number;
  lowStockOnly?: boolean;
  page?: number;
  limit?: number;
}