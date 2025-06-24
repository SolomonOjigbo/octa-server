// Session
export interface OpenPOSSessionDto {
  tenantId: string;
  storeId: string;
  userId: string;
  openingBalance: number;
}
export interface ClosePOSSessionDto {
  sessionId: string;
  closingBalance: number;
  closedAt?: string | Date;
}
export type ShippingType = "pickup" | "delivery";

// Transaction

export interface CreatePOSTransactionItemDto {
  productId: string;
  quantity: number;
  price: number;
  discount?: number;
  batchNumber?: string;
  expiryDate?: string | Date;
  taxRate?: number;
}

export interface CreatePOSTransactionDto {
  tenantId: string;
  storeId: string;
  userId: string;
  customerId?: string;
  items: CreatePOSTransactionItemDto[];
  discount?: number; // Transaction-level discount (flat)
  taxAmount?: number; // Transaction-level total tax (will be calculated if omitted)
  paymentMethod: string;
  totalAmount?: number; // Will be calculated if omitted
  sessionId: string;
  shippingType?: ShippingType;
  shippingFee?: number;
  shippingAddress?: string;
}


// Payment
export interface CreatePOSPaymentDto {
  tenantId: string;
  transactionId: string;
  amount: number;
  method: string; // "cash", "card", etc.
  reference?: string;
}

// Return/Refund
export interface CreateSalesReturnDto {
  tenantId: string;
  originalTransactionId: string;
  userId: string;
  items: {
    productId: string;
    quantity: number;
    reason?: string;
  }[];
  refundMethod: string; // cash/card/transfer/etc
  sessionId: string;
}

// Discount already included per item/transaction

// Cash Drop
export interface CreateCashDropDto {
  tenantId: string;
  storeId: string;
  sessionId: string;
  userId: string;
  amount: number;
  reason?: string;
}
