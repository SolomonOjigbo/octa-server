// // src/modules/purchaseOrder/types/purchaseOrder.dto.ts

import { z } from "zod";
import { CancelPurchaseOrderSchema, CreatePurchaseOrderSchema, LinkPaymentSchema, PurchaseOrderItemSchema, PurchaseOrderStatusSchema, UpdatePurchaseOrderSchema } from "../validations";

export type PurchaseOrderItemDto = z.infer<
  typeof PurchaseOrderItemSchema
>;

export type CreatePurchaseOrderDto = z.infer<
  typeof CreatePurchaseOrderSchema
>;

export type UpdatePurchaseOrderDto = z.infer<
  typeof UpdatePurchaseOrderSchema
>;

export type CancelPurchaseOrderDto = z.infer<typeof CancelPurchaseOrderSchema>;
export type PurchaseOrderStatus = z.infer<typeof PurchaseOrderStatusSchema>;
export type LinkPaymentDto = z.infer<typeof LinkPaymentSchema>;




// export type PurchaseOrderStatus = 'pending' | 'approved' | 'received' | 'cancelled';


// export interface PurchaseOrderItemDto {
//   tenantProductId: string;
//   tenantProductVariantId?: string;
//   quantity: number;
//   costPrice: number;
//   batchNumber?: string;
//   expiryDate?: Date;
// }

// export interface CreatePurchaseOrderDto {
//   supplierId: string;
//   storeId?: string;
//   warehouseId?: string;
//   orderDate: Date | string;
//   receivedDate?: Date;
//   totalAmount: number;
//   notes?: string;
//   items: PurchaseOrderItemDto[];
// }

// export interface UpdatePurchaseOrderDto {
//   status?: PurchaseOrderStatus;
//   receivedDate?: Date;
//   notes?: string;
// }

// export interface CancelPurchaseOrderDto {
//   reason?: string;
// }

// export interface LinkPaymentDto {
//   paymentId: string;
//   amount: number;
// }

// export interface PurchaseOrderResponseDto {
//   id: string;
//   tenantId: string;
//   supplierId: string;
//   storeId?: string;
//   warehouseId?: string;
//   status: PurchaseOrderStatus;
//   orderDate: Date;
//   receivedDate?: Date;
//   totalAmount: number;
//   notes?: string;
//   createdById?: string;
//   updatedById?: string;
//   createdAt: Date;
//   updatedAt: Date;
//   items: Array<PurchaseOrderItemDto & { id: string; purchaseOrderId: string }>;
// }

// export interface UpdatePurchaseOrderDto {
//   status?: 'pending' | 'approved' | 'received' | 'cancelled';
//   notes?: string;
//   receivedDate?: Date;
//   updatedBy: string;
// }

// export interface CancelPurchaseOrderDto {
//   reason?: string;
//   cancelledBy: string;
// }

// export interface LinkPaymentDto {
//   paymentId: string;
//   amount: number;
//   linkedBy: string;
// }

// export interface ApprovePurchaseOrderDto {
//   approvedBy: string;
//   notes?: string;
// }

// export interface CreateControlledSubstanceOrderDto {
//   pharmacistId: string;
//   tenantId: string;
//   supplierId: string;
//   storeId?: string;
//   warehouseId?: string;
//   orderDate: Date | string;
//   totalAmount: number;
//   notes?: string;
//   requestedBy: string;
//   items: {
//     tenantProductId: string;
//     quantity: number;
//     costPrice: number;
//     batchNumber?: string;
//     expiryDate?: string;
//     isControlled?: boolean;
//   }[];
// }

// export interface ListPendingOrdersDto {
//   tenantId: string;
//   storeId?: string;
//   warehouseId?: string;
//   status?: PurchaseOrderStatus;
//   startDate?: Date | string;
//   endDate?: Date | string;
//   supplierId?: string;
//   requestedBy?: string;
//   limit?: number;
//   page?: number;
// }

// export interface PurchaseOrderItemResponseDto {
//   id: string;
//   tenantProductId: string;
//   quantity: number;
//   costPrice: number;
//   batchNumber?: string;
//   expiryDate?: Date;
//   isControlled?: boolean;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface ListPurchaseOrdersDto {
//   tenantId: string;
//   storeId?: string;
//   warehouseId?: string;
//   tenantProductId?: string;
//   status?: PurchaseOrderStatus;
//   startDate?: Date | string;
//   endDate?: Date | string;
//   supplierId?: string;
//   requestedBy?: string;
//   limit?: number;
//   page?: number;
// }



