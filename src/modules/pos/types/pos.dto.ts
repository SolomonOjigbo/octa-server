// src/modules/pos/types/pos.dto.ts

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
  discount?: number;
  tax?: number;
  storeId?: string;
  metadata?: Record<string, any>;
}

export interface CreateTransactionDto {
  sessionId: string;
  customerId?: string;
  items: SaleItemDto[];
  paymentMethod: string;
  total: number;
  cashReceived?: number;
  reference: string;
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
