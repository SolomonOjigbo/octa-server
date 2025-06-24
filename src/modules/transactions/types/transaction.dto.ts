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
