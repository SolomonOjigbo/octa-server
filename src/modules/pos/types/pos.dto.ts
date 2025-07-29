// src/modules/pos/types/pos.dto.ts

import { TransactionStatus } from "@modules/transactions/types/transaction.dto";
import { TransactionReferenceType } from "@prisma/client";

export type OpenSessionDto = {
  storeId: string;
  openingBalance: number;
  notes?: string;
};

export type CloseSessionDto = {
  sessionId: string;
  closingBalance: number;
  closedBy: string;         // ✅ explicitly set who closed it
  notes?: string;
};


export interface SaleItemDto {
  tenantProductId: string;
  tenantProductVariantId?: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  name: string;
  sku: string;
  discount?: number;
  tax?: number;
  storeId?: string;
  transaction?: string;
  metadata?: Record<string, any>;
}

export interface CreateTransactionDto {
  sessionId: string;
  customerId?: string;
  items: SaleItemDto[];
  status?: TransactionStatus;
  paymentMethod: string;
  amount: number;
  cashReceived?: number;
  referenceType?: TransactionReferenceType;
  referenceId: string;
}

export interface CreatePaymentDto {
  transactionId: string;
  amount: number;
  method: string;
  reference?: string;
  status?: string;
}


export interface CreateSalesReturnDto {
  transactionId: string;
  sessionId: string;
  refundAmount: number;
  paymentMethod: string;
  customerId: string;
  reference?: string;
  reason?:    string;
  items: SaleItemDto[];
  userId?: string;
}

export interface CreateCashDropDto {
  sessionId: string;
  amount: number;
  reason?: string;
}

export interface ReconcileCashDto {
  sessionId: string;
  actualCash: number;
  varianceReason?: string;
  variance?: number;
  expectedCash: number;
}

export interface POSSessionSummary {
  sessionId: string;
  openedBy: string;
  openedAt: Date;
  closedAt?: Date;
  totalSales: number;
  totalPayments: number;
  totalReturns: number;
  totalCashDrops: number;
  totalReconciled: number;
}

export interface POSReceipt {
  transactionId: string;
  sessionId: string;
  items: SaleItemDto[];
  totalAmount: number;
  payments: Array<{ amount: number; method: string; reference?: string }>;
  createdAt: Date;
}
