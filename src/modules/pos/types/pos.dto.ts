// src/modules/pos/types/pos.dto.ts

export interface OpenSessionDto {}

export interface CloseSessionDto {
  closingCash: number;
  notes?: string;
}

export interface SaleItemDto {
  tenantProductId: string;
  tenantProductVariantId?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
}

export interface CreateTransactionDto {
  sessionId: string;
  customerId?: string;
  items: SaleItemDto[];
  paymentMethod: string;
  cashReceived?: number;
}

export interface CreatePaymentDto {
  transactionId: string;
  amount: number;
  method: string;
  reference?: string;
}

export interface CreateSalesReturnDto {
  transactionId: string;
  items: Array<{
    tenantProductId: string;
    tenantProductVariantId?: string;
    quantity: number;
    reason?: string;
  }>;
}

export interface CreateCashDropDto {
  sessionId: string;
  amount: number;
  reason?: string;
}

export interface ReconcileCashDto {
  sessionId: string;
  countedCashAmount: number;
  varianceReason?: string;
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
