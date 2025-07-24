// src/modules/payment/types/payment.dto.ts
import {
  PaymentReferenceType,
  PaymentStatus
} from '@prisma/client';

export interface CreatePaymentDto {
  amount:           number;
  method:           string;
  reference?:       string;
  status?:          PaymentStatus;
  referenceType?:   PaymentReferenceType;
  transactionId?:   string;
  purchaseOrderId?: string;
  invoiceId?:       string;
  sessionId?:       string;
  userId?:          string;
  paymentDate?:     Date;
}

export interface UpdatePaymentDto {
  amount?:        number;
  method?:        string;
  reference?:     string;
  status?:        PaymentStatus;
  referenceType?: PaymentReferenceType;
  paymentDate?:   Date;
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

