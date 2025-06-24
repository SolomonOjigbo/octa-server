// Purchase Order Item
export interface CreatePurchaseOrderItemDto {
  productId: string;
  quantity: number;
  costPrice: number;
  batchNumber?: string;
  expiryDate?: string | Date;
}

// Purchase Order
export interface CreatePurchaseOrderDto {
  tenantId: string;
  supplierId: string;
  storeId?: string;
  warehouseId?: string;
  orderDate: string | Date;
  items: CreatePurchaseOrderItemDto[];
  totalAmount: number;
  notes?: string;
}

// For updating status, items, payment, or receiving
export interface UpdatePurchaseOrderDto {
  status?: "pending" | "approved" | "received" | "cancelled";
  receivedDate?: string | Date;
  notes?: string;
}

export interface CancelPurchaseOrderDto {
  cancelledBy: string;
  reason?: string;
}

// For linking payments to PO
export interface LinkPaymentDto {
  paymentId: string;
  amount: number;
}
