import { StockMovementType } from "@common/types/stockMovement.dto";

// Base Types
interface InventoryLocation {
  type: 'store' | 'warehouse' | 'clinic' | 'supplier' | 'customer';
  id: string;
  name?: string;
}

interface ProductReference {
  id: string;
  name: string;
  sku: string;
  sellingPrice?: number;
  isControlled?: boolean;
}

interface VariantReference {
  id: string;
  name: string;
  sku: string;
}

interface TemperatureLog {
  min: number;
  max: number;
  avg: number;
}

// Core DTOs
export interface InventoryMovementDto {
  id: string;
  tenantId: string;
  userId?: string;
  storeId?: string;
  warehouseId?: string;
  productId: string;
  variantId?: string;
  batchNumber?: string;
  quantity: number;
  movementType: StockMovementType;
  source?: InventoryLocation;
  destination?: InventoryLocation;
  reference?: string;
  costPrice?: number;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    prescriptionId?: string;
    pharmacistId?: string;
    temperatureLog?: TemperatureLog;
    isControlled?: boolean;
    requiresRefrigeration?: boolean;
  };
}

export interface InventoryResponseDto {
  id: string;
  tenantId: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  variant?: {
    id: string;
    name: string;
    sku: string;
  };
  location: {
    type: 'store' | 'warehouse';
    id: string;
    name: string;
  };
  batchNumber?: string;
  quantity: number;
  costPrice?: number;
  expiryDate?: Date;
  movementType: string;
  reference?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedInventory {
  data: InventoryResponseDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Request/Response Types
export interface CreateInventoryMovementDto {
  tenantId: string;
  productId: string;
  variantId?: string;
  batchNumber?: string;
  quantity: number;
  movementType: StockMovementType.TRANSFER_IN | StockMovementType.TRANSFER_OUT | StockMovementType.PURCHASE | StockMovementType.SALE | StockMovementType.ADJUSTMENT | StockMovementType.RETURN | StockMovementType.WASTAGE | StockMovementType.EXPIRE | StockMovementType.DAMAGE | StockMovementType.RECALL | StockMovementType.COMPOUNDING | StockMovementType.DONATION | StockMovementType.SAMPLES;
  source?: InventoryLocation;
  destination?: InventoryLocation;
  reference?: string;
  costPrice?: number;
  expiryDate?: Date | string;
  metadata?: {
    prescriptionId?: string;
    pharmacistId?: string;
    temperatureLog?: TemperatureLog;
  };
}

export interface UpdateInventoryMovementDto {
  batchNumber?: string;
  quantity?: number;
  movementType?: StockMovementType;
  costPrice?: number;
  expiryDate?: Date | string;
  reference?: string;
  metadata?: {
    prescriptionId?: string;
    pharmacistId?: string;
    temperatureLog?: TemperatureLog;
  };
}

// Filter Types
export interface InventoryMovementFilter {
  productId?: string;
  variantId?: string;
  storeId?: string;
  warehouseId?: string;
  movementType?: StockMovementType;
  startDate?: Date | string;
  endDate?: Date | string;
  reference?: string;
  batchNumber?: string;
  isControlled?: boolean;
  expiringSoon?: boolean; // Special flag for pharmacy expiry alerts
  page?: number;
  limit?: number;
}