export interface CreatePaymentDto {
  tenantId: string;
  amount: number;
  method: string;
  reference?: string;
  status?: string;
  transactionId?: string;      // For POS sales
  purchaseOrderId?: string;    // For supplier purchases
  sessionId?: string;
  userId?: string;
  paidAt?: string | Date;

}

export interface UpdatePaymentDto {
  status?: string;
  paidAt?: string | Date;
  reference?: string;
}

export interface CreateRefundDto {
  tenantId: string;
  originalPaymentId: string;
  amount: number;
  method: string;
  reason?: string;
  transactionId?: string;
  purchaseOrderId?: string;
  userId?: string;
  sessionId?: string;
}


