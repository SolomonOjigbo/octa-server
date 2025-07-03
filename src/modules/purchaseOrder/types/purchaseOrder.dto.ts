// modules/purchaseOrder/types/purchaseOrder.dto.ts
import { z } from "zod";
import { createPurchaseOrderItemSchema, createPurchaseOrderSchema, updatePurchaseOrderSchema, cancelPurchaseOrderSchema, linkPaymentSchema } from "../validations";

// Base Types
export interface PurchaseOrderItemResponseDto {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  costPrice: number;
  batchNumber?: string;
  expiryDate?: Date;
  isControlled: boolean;
}

export interface PurchaseOrderResponseDto {
  id: string;
  tenantId: string;
  supplier: {
    id: string;
    name: string;
  };
  store?: {
    id: string;
    name: string;
  };
  warehouse?: {
    id: string;
    name: string;
  };
  orderDate: Date;
  receivedDate?: Date;
  status: "pending" | "approved" | "received" | "cancelled";
  totalAmount: number;
  paidAmount: number;
  balance: number;
  notes?: string;
  items: PurchaseOrderItemResponseDto[];
  payments: {
    id: string;
    amount: number;
    method: string;
    status: string;
    paidAt?: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Request DTOs (infer from Zod schemas)
export type CreatePurchaseOrderItemDto = z.infer<typeof createPurchaseOrderItemSchema>;
export type CreatePurchaseOrderDto = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderDto = z.infer<typeof updatePurchaseOrderSchema>;
export type CancelPurchaseOrderDto = z.infer<typeof cancelPurchaseOrderSchema>;
export type LinkPaymentDto = z.infer<typeof linkPaymentSchema>;

// Filter DTOs
export interface ListPurchaseOrdersDto {
  tenantId: string;
  supplierId?: string;
  status?: "pending" | "approved" | "received" | "cancelled";
  storeId?: string;
  warehouseId?: string;
  productId?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}