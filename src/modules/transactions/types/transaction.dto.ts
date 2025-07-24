
export enum TransactionReferenceType {
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  POS_TRANSACTION = 'POS_TRANSACTION',
  STOCK_TRANSFER = 'STOCK_TRANSFER',
  B2B_CONNECTION = 'B2B_CONNECTION',
  INVOICE = 'INVOICE'
}

// For payment status
export enum TransactionPaymentStatus {
  BILLED = 'BILLED',
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

// For transaction status
export enum TransactionStatus {
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
  RETURNED = 'RETURNED',
}
  



export interface CreateTransactionDto {
  storeId?:       string;
  warehouseId?:   string;
  customerId?:    string;
  amount:         number;
  discount?:      number;
  taxAmount?:     number;
  referenceType:  TransactionReferenceType;
  referenceId?:   string;
  shippingFee?:   number;
  shippingType?:  string;
  shippingAddress?: string;
  metadata?:      Record<string, any>;
  paymentMethod:  string;
  paymentStatus?: TransactionPaymentStatus;
  status?:        TransactionStatus;
  posSessionId?:  string;
}

export interface UpdateTransactionDto extends Partial<CreateTransactionDto> {}


export interface TransactionResponseDto extends CreateTransactionDto {
  id:              string;
  tenantId:        string;
  createdById?:    string;
  updatedById?:    string;
  createdAt:       Date;
  updatedAt:       Date;
}

export interface GetTransactionFilters {
  tenantId: string;
  storeId?: string;
  customerId?: string;
  sessionId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

// export interface UpdateTransactionStatusDto {
//   status: string;
// }

// export type TransactionReferenceType =
//   | 'purchaseOrder'
//   | 'posTransaction'
//   | 'stockTransfer'
//   | 'b2bConnection'
//   | 'invoice'; 

// export type TransactionStatus =
//   | 'pending'
//   | 'posted'
//   | 'failed'
//   | 'voided';

// export type TransactionPaymentStatus =
//   | 'unpaid'
//   | 'paid'
//   | 'partiallyPaid'
//   | 'refunded';