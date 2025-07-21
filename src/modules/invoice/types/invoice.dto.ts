// src/modules/invoice/types/invoice.dto.ts

export type InvoiceStatus =
  | 'draft'
  | 'issued'
  | 'paid'
  | 'partiallyPaid'
  | 'overdue'
  | 'cancelled';

export type ReferenceType =
  | 'purchaseOrder'
  | 'posTransaction'
  | 'stockTransfer'
  | 'b2bConnection';

export interface InvoiceItemDto {
  productId:   string;
  variantId?:  string;
  description: string;
  quantity:    number;
  unitPrice:   number;
  taxAmount:   number;
  lineTotal:   number;
}

export interface CreateInvoiceDto {
  referenceType: ReferenceType;
  referenceId?:  string;
  customerId?:   string;
  dueDate?:      Date;
  currency?:     string;
  metadata?:     Record<string, any>;
  items:         Omit<InvoiceItemDto,'lineTotal'>[];
}

export interface IssueInvoiceDto {
  invoiceNo: string;
  dueDate?:  Date;
}

export interface UpdateInvoiceDto {
  dueDate?:  Date;
  status?:   InvoiceStatus;
  metadata?: Record<string, any>;
}

export interface ApplyPaymentDto {
  paymentId: string;
  amount?:   number;
}

export interface InvoiceResponseDto {
  id:            string;
  tenantId:      string;
  referenceType: ReferenceType;
  referenceId?:  string;
  customerId?:   string;
  invoiceNo?:    string;
  issueDate:     Date;
  dueDate?:      Date;
  status:        InvoiceStatus;
  currency:      string;
  subTotal:      number;
  taxTotal:      number;
  totalAmount:   number;
  paymentStatus: 'unpaid'|'paid'|'partiallyPaid'|'refunded';
  metadata?:     Record<string, any>;
  createdById?:  string;
  updatedById?:  string;
  createdAt:     Date;
  updatedAt:     Date;
}

export interface InvoiceDetailDto extends InvoiceResponseDto {
  items:    InvoiceItemDto[];
  payments: Array<{ id:string; amount:number; method:string; paidAt: Date }>;
}

export class CreateInvoicePaymentDto {
  invoiceId: string;
  amount: number;
  method: string; // e.g. cash, card, bank-transfer
  reference?: string;
  metadata?: any;
}
