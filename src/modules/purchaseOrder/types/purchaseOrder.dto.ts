// src/modules/purchaseOrder/types/purchaseOrder.dto.ts

export type PurchaseOrderStatus = 'pending' | 'approved' | 'received' | 'cancelled';

export interface PurchaseOrderItemDto {
  productId: string;
  quantity: number;
  costPrice: number;
  batchNumber?: string;
  expiryDate?: Date;
  isControlled?: boolean;
}


export interface UpdatePurchaseOrderDto {
  status?: PurchaseOrderStatus;
  notes?: string;
  receivedDate?: Date;
  updatedBy: string;
}

export interface CancelPurchaseOrderDto {
  reason?: string;
  cancelledBy: string;
}

export interface LinkPaymentDto {
  paymentId: string;
  amount: number;
  linkedBy: string;
}

export interface CreatePurchaseOrderDto {
  tenantId: string;
  supplierId: string;
  storeId?: string;
  warehouseId?: string;
  orderDate: Date | string;
  totalAmount: number;
  notes?: string;
  requestedBy: string;
  items: {
    productId: string;
    quantity: number;
    costPrice: number;
    batchNumber?: string;
    expiryDate?: Date | string;
    isControlled?: boolean;
  }[];
}

export interface UpdatePurchaseOrderDto {
  status?: 'pending' | 'approved' | 'received' | 'cancelled';
  notes?: string;
  receivedDate?: Date;
  updatedBy: string;
}

export interface CancelPurchaseOrderDto {
  reason?: string;
  cancelledBy: string;
}

export interface LinkPaymentDto {
  paymentId: string;
  amount: number;
  linkedBy: string;
}

export interface ApprovePurchaseOrderDto {
  approvedBy: string;
  notes?: string;
}

export interface CreateControlledSubstanceOrderDto {
  pharmacistId: string;
  tenantId: string;
  supplierId: string;
  storeId?: string;
  warehouseId?: string;
  orderDate: Date | string;
  totalAmount: number;
  notes?: string;
  requestedBy: string;
  items: {
    productId: string;
    quantity: number;
    costPrice: number;
    batchNumber?: string;
    expiryDate?: string;
    isControlled?: boolean;
  }[];
}

export interface ListPendingOrdersDto {
  tenantId: string;
  storeId?: string;
  warehouseId?: string;
  status?: PurchaseOrderStatus;
  startDate?: Date | string;
  endDate?: Date | string;
  supplierId?: string;
  requestedBy?: string;
  limit?: number;
  page?: number;
}

export interface PurchaseOrderResponseDto {
  id: string;
  tenantId: string;
  supplierId: string;
  storeId?: string;
  warehouseId?: string;
  orderDate: Date;
  totalAmount: number;
  paidAmount?: number;
  balance?: number;
  paymentStatus?: 'pending' | 'paid' | 'partially_paid';
  approvedBy?: string;
  notes?: string;
  requestedBy: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItemDto[];
  createdAt: Date;
  updatedAt: Date;
  receivedDate?: Date;
  cancelledBy?: string;
  cancelledAt?: Date;
}

export interface PurchaseOrderItemResponseDto {
  id: string;
  productId: string;
  quantity: number;
  costPrice: number;
  batchNumber?: string;
  expiryDate?: Date;
  isControlled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListPurchaseOrdersDto {
  tenantId: string;
  storeId?: string;
  warehouseId?: string;
  productId?: string;
  status?: PurchaseOrderStatus;
  startDate?: Date | string;
  endDate?: Date | string;
  supplierId?: string;
  requestedBy?: string;
  limit?: number;
  page?: number;
}