export type PaymentStatus = 'pending'|'completed'|'failed'|'refunded'|'cancelled';

export interface CreatePaymentDto {
  purchaseOrderId?: string;
  transactionId?:   string;
  sessionId?:       string;     // ← add
  amount:           number;
  method:           string;
  reference?:       string;
  status?:          'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paidAt?:          Date;
}

export interface UpdatePaymentDto {
  amount?:    number;
  method?:    string;
  reference?: string;
  status?:    PaymentStatus;
  paidAt?:    Date;              // ← add
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

export interface PaymentResponseDto {
  id:               string;
  tenantId:         string;
  userId:           string;
  purchaseOrderId?: string;
  transactionId?:   string;
  amount:           number;
  method:           string;
  reference?:       string;
  status:           PaymentStatus;
  paymentDate:      Date;
  createdById?:     string;
  createdAt:        Date;
  updatedAt:        Date;
}

export interface RefundPaymentDto {
  amount?: number;       // default full
  reason?: string;
}
export interface ReversePaymentDto {
  reason?: string;
}

