export interface GetTransactionFilters {
  tenantId: string;
  storeId?: string;
  customerId?: string;
  sessionId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface UpdateTransactionStatusDto {
  status: string;
}

// transaction.dto.ts

export type TransactionReferenceType =
  | 'purchaseOrder'
  | 'posTransaction'
  | 'stockTransfer'
  | 'b2bConnection'
  | 'invoice'; 

export type TransactionStatus =
  | 'pending'
  | 'posted'
  | 'failed'
  | 'voided';

export type TransactionPaymentStatus =
  | 'unpaid'
  | 'paid'
  | 'partiallyPaid'
  | 'refunded';

export interface CreateTransactionDto {
  referenceType:    TransactionReferenceType;
  referenceId?:     string;
  amount:           number;
  date?:            Date;
  status?:          TransactionStatus;
  paymentStatus?:   TransactionPaymentStatus;
  metadata?:        Record<string, any>;
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

