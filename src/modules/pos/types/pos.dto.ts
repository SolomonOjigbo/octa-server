import { z } from "zod";

// Session DTOs
export interface OpenPOSSessionDto {
  tenantId: string;
  storeId: string;
  userId: string;
  openingBalance: number;
  openedAt?: Date;
  openedBy?: string; // Optional field to track who opened the session
}

export interface ClosePOSSessionDto {
  sessionId: string;
  closingBalance: number;
  closedAt?: Date;
  closedBy?: string;
}

export interface POSSessionResponseDto {
  id: string;
  tenantId: string;
  storeId: string;
  userId: string;
  openingBalance: number;
  closingBalance?: number;
  isOpen: boolean;
  openedAt: Date;
  closedAt?: Date;
  cashDifference?: number;
  store?: {
    id: string;
    name: string;
    type: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// Transaction DTOs
export type ShippingType = "pickup" | "delivery";

export interface CreatePOSTransactionItemDto {
  productId: string;
  quantity: number;
  price?: number;
  discount?: number;
  taxRate?: number;
  batchNumber?: string;
  expiryDate?: Date;
  isPrescription?: boolean;
  isControlled?: boolean;
}

export interface CreatePOSTransactionDto {
  tenantId: string;
  storeId: string;
  userId: string;
  customerId?: string;
  pharmacistId?: string; // Required for controlled substances
  items: CreatePOSTransactionItemDto[];
  discount?: number;
  taxAmount?: number;
  paymentMethod: string;
  totalAmount?: number;
  sessionId: string;
  shippingType?: ShippingType;
  shippingFee?: number;
  shippingAddress?: string;
}

export interface TransactionResponseDto {
  id: string;
  tenantId: string;
  storeId: string;
  userId: string;
  customerId?: string;
  pharmacistId?: string;
  totalAmount: number;
  taxAmount: number;
  discount: number;
  shippingFee?: number;
  shippingType?: ShippingType;
  shippingAddress?: string;
  paymentMethod: string;
  status: string;
  paymentStatus: string;
  sessionId: string;
  originalTransactionId?: string;
  createdAt: Date;
  items: {
    id: string;
    productId: string;
    quantity: number;
    price: number;
    discount?: number;
    taxRate?: number;
    taxAmount?: number;
    batchNumber?: string;
    expiryDate?: Date;
    isPrescription?: boolean;
    isControlled?: boolean;
  }[];
  customer?: {
    id: string;
    name: string;
    loyaltyNumber?: string;
  };
  posSession?: {
    id: string;
    userId: string;
    openedAt: Date;
  };
  user?: {
    id: string;
    name: string;
  };
}

// Payment DTOs
export interface CreatePOSPaymentDto {
  tenantId: string;
  transactionId: string;
  amount: number;
  method: string;
  reference?: string;
  processedBy: string;
}

export interface PaymentResponseDto {
  id: string;
  tenantId: string;
  transactionId: string;
  amount: number;
  method: string;
  reference?: string;
  status: string;
  paidAt: Date;
  userId?: string;
  sessionId?: string;
  transaction?: {
    id: string;
    totalAmount: number;
    customerId?: string;
  };
  user?: {
    id: string;
    name: string;
  };
}

// Return/Refund DTOs
export interface CreateSalesReturnDto {
  tenantId: string;
  originalTransactionId: string;
  userId: string;
  items: {
    productId: string;
    quantity: number;
    reason?: string;
  }[];
  refundMethod: string;
  sessionId: string;
  processedBy: string;
}

// Cash Drop DTOs
export interface CreateCashDropDto {
  tenantId: string;
  storeId: string;
  sessionId: string;
  userId: string;
  amount: number;
  reason?: string;
  processedBy: string;
}

export interface CashDropResponseDto {
  id: string;
  tenantId: string;
  storeId: string;
  sessionId: string;
  userId: string;
  amount: number;
  method: string;
  reference?: string;
  status: string;
  paidAt: Date;
  processedBy: string;
}

// Receipt DTO
export interface ReceiptResponseDto {
  id: string;
  date: Date;
  storeId: string;
  cashier: {
    id: string;
    name: string;
  };
  customer?: {
    id: string;
    name: string;
    loyaltyNumber?: string;
  };
  items: {
    productId: string;
    name: string;
    batchNumber?: string;
    expiryDate?: Date;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
    taxAmount: number;
    lineTotal: number;
    isPrescription?: boolean;
    isControlled?: boolean;
  }[];
  subtotal: number;
  tax: number;
  discount: number;
  shipping: number;
  grandTotal: number;
  payments: {
    method: string;
    amount: number;
    reference?: string;
  }[];
  paymentStatus: string;
  shippingType?: ShippingType;
  shippingAddress?: string;
  sessionId: string;
  originalTransactionId?: string;
}

// Session Payments Breakdown DTO
export interface SessionPaymentsBreakdownDto {
  payments: {
    method: string;
    _sum: {
      amount: number;
    };
  }[];
  total: number;
}

// Cash Reconciliation DTO
export interface CashReconciliationResultDto {
  tenantId: string;
  storeId: string;
  userId: string;
  payments: {
    method: string;
    _sum: {
      amount: number;
    };
  }[];
  total: number;
  openingBalance: number;
  declaredClosingCash: number;
  cashDrops: number;
  cashSales: number;
  cashTotal: number;
  expectedCash: number;
  cashRefunds: number;
  cashDifference: number;
  status: "OK" | "DISCREPANCY";
  sessionOpenedAt: Date;
  sessionClosedAt?: Date;
}

// Filter DTOs
export interface ListSessionsFilter {
  storeId?: string;
  userId?: string;
  status?: "open" | "closed";
  fromDate?: Date;
  toDate?: Date;
}

export interface ListTransactionsFilter {
  storeId?: string;
  sessionId?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  customerId?: string;
  paymentMethod?: string;
  userId?: string;
  shippingType?: ShippingType;
  shippingAddress?: string; 

}

export interface ListPaymentsFilter {
  transactionId?: string;
  method?: string;
  fromDate?: Date;
  toDate?: Date;
}

// Zod Schemas
export const openPOSSessionSchema = z.object({
  tenantId: z.string().cuid(),
  storeId: z.string().cuid(),
  userId: z.string().cuid(),
  openingBalance: z.number().nonnegative(),
});

export const closePOSSessionSchema = z.object({
  sessionId: z.string().cuid(),
  closingBalance: z.number().nonnegative(),
  closedAt: z.date().optional(),
  closedBy: z.string().cuid().optional(),
});

