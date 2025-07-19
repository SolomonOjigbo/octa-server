// // src/modules/inventory/types/inventory.dto.ts
// import { StockMovementType } from "@common/types/stockMovement.dto";

import { z } from "zod";
import { InventoryMovementSchema } from "../validations";

export type InventoryMovementDto = z.infer<typeof InventoryMovementSchema>;


// export interface InventoryMovementDto {
//   tenantProductId: string;
//   tenantProductVariantId?: string;
//   quantity: number;
//   costPrice?: number;
//   movementType: string;
//   reference?: string;
//   batchNumber?: string;
//   expiryDate?: Date;
//   storeId?: string;
//   warehouseId?: string;
//   temperature?: number;
//   isControlled?: boolean;
//   requiresRefrigeration?: boolean;
//   metadata?: Record<string, any>;
// }

// export interface UpdateInventoryMovementDto extends Partial<InventoryMovementDto> {}

// export interface InventoryResponseDto {
//   id: string;
//   tenantId: string;
//   tenantProductId: string;
//   tenantProductVariantId?: string;
//   quantity: number;
//   costPrice?: number;
//   movementType: string;
//   reference?: string;
//   batchNumber?: string;
//   expiryDate?: Date;
//   storeId?: string;
//   warehouseId?: string;
//   temperature?: number;
//   isControlled: boolean;
//   requiresRefrigeration: boolean;
//   metadata?: Record<string, any>;
//   createdById?: string;
//   verifiedById?: string;
//   createdAt: Date;
//   updatedAt: Date;
// }


// export interface PaginatedInventory {
//   data: InventoryResponseDto[];
//   pagination: {
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//   };
// }

// // Request/Response Types
// export interface CreateInventoryMovementDto {
//   tenantId: string;
//   productId: string;
//   variantId?: string;
//   batchNumber?: string;
//   quantity: number;
//   movementType: StockMovementType.TRANSFER_IN | StockMovementType.TRANSFER_OUT | StockMovementType.PURCHASE | StockMovementType.SALE | StockMovementType.ADJUSTMENT | StockMovementType.RETURN | StockMovementType.WASTAGE | StockMovementType.EXPIRE | StockMovementType.DAMAGE | StockMovementType.RECALL | StockMovementType.COMPOUNDING | StockMovementType.DONATION | StockMovementType.SAMPLES;
//   source?: InventoryLocation;
//   destination?: InventoryLocation;
//   reference?: string;
//   costPrice?: number;
//   expiryDate?: Date | string;
//   metadata?: {
//     prescriptionId?: string;
//     pharmacistId?: string;
//     temperatureLog?: TemperatureLog;
//   };
// }


// // Filter Types
// export interface InventoryMovementFilter {
//   productId?: string;
//   variantId?: string;
//   storeId?: string;
//   warehouseId?: string;
//   movementType?: StockMovementType;
//   startDate?: Date | string;
//   endDate?: Date | string;
//   reference?: string;
//   batchNumber?: string;
//   isControlled?: boolean;
//   expiringSoon?: boolean; // Special flag for pharmacy expiry alerts
//   page?: number;
//   limit?: number;
// }

// interface InventoryLocation {
//   type: 'store' | 'warehouse' | 'clinic' | 'supplier' | 'customer';
//   id: string;
//   name?: string;
// }

// interface ProductReference {
//   id: string;
//   name: string;
//   sku: string;
//   sellingPrice?: number;
//   isControlled?: boolean;
// }

// interface VariantReference {
//   id: string;
//   name: string;
//   sku: string;
// }

// interface TemperatureLog {
//   min: number;
//   max: number;
//   avg: number;
// }