// src/modules/invoice/types/invoice.dto.ts

export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type InvoiceReferenceType =
  | 'PURCHASE_ORDER'
  | 'POS_TRANSACTION'
  | 'STOCK_TRANSFER'
  | 'B2B_CONNECTION';

export type PaymentStatus =
  | 'PROCESSING'
  | 'UNPAID'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'REFUNDED';

export interface InvoiceItemDto {
  productId: string;
  variantId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  lineTotal: number;
}

export interface CreateInvoiceDto {
  referenceType: InvoiceReferenceType;
  referenceId?: string;
  invoiceNo: string;
  customerId?: string;
  dueDate?: Date;
  currency?: string;
  metadata?: JSON;
  items: Omit<InvoiceItemDto, 'lineTotal'>[];
}

export interface IssueInvoiceDto {
  invoiceNo: string;
  dueDate?: Date;
}

export interface UpdateInvoiceDto {
  dueDate?: Date;
  status?: InvoiceStatus;
  metadata?: Record<string, any>;
}

export interface ApplyPaymentDto {
  amount?: number;
  method?: 'CASH' | 'CARD' | 'TRANSFER' | 'WALLET' | 'INVOICE';
  reference?: string;
}

export interface InvoiceResponseDto {
  id: string;
  tenantId: string;
  referenceType?: InvoiceReferenceType;
  referenceId?: string;
  customerId?: string;
  customer?: string;
  createdBy?: string;
  invoiceNo?: string;
  issueDate?: Date;
  dueDate?: Date;
  status: InvoiceStatus;
  subTotal: number;
  taxTotal: number;
  totalAmount: number;
  // items: InvoiceItemDto[];
  paymentStatus: PaymentStatus;
  metadata?: Record<string, any>;
  createdById?: string;
  updatedById?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceDetailDto extends InvoiceResponseDto {
  items: InvoiceItemDto[];
  id: string;
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    paidAt: Date;
    status: PaymentStatus;
  }>;
}

export interface CreateInvoicePaymentDto {
  invoiceId: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'TRANSFER' | 'WALLET' | 'INVOICE';
  reference?: string;
  metadata?: any;
}


// export type InvoiceStatus =
//   | 'draft'
//   | 'issued'
//   | 'paid'
//   | 'partiallyPaid'
//   | 'overdue'
//   | 'cancelled';

// export type ReferenceType =
//   | 'purchaseOrder'
//   | 'posTransaction'
//   | 'stockTransfer'
//   | 'b2bConnection';

// export interface InvoiceItemDto {
//   productId:   string;
//   variantId?:  string;
//   description: string;
//   quantity:    number;
//   unitPrice:   number;
//   taxAmount:   number;
//   lineTotal:   number;
// }

// export interface CreateInvoiceDto {
//   referenceType: ReferenceType;
//   referenceId?:  string;
//   customerId?:   string;
//   dueDate?:      Date;
//   currency?:     string;
//   metadata?:     Record<string, any>;
//   items:         Omit<InvoiceItemDto,'lineTotal'>[];
// }

// export interface IssueInvoiceDto {
//   invoiceNo: string;
//   dueDate?:  Date;
// }

// export interface UpdateInvoiceDto {
//   dueDate?:  Date;
//   status?:   InvoiceStatus;
//   metadata?: Record<string, any>;
// }

// export interface ApplyPaymentDto {
//   paymentId: string;
//   amount?:   number;
// }

// export interface InvoiceResponseDto {
//   id:            string;
//   tenantId:      string;
//   referenceType: ReferenceType;
//   referenceId?:  string;
//   customerId?:   string;
//   invoiceNo?:    string;
//   issueDate:     Date;
//   dueDate?:      Date;
//   status:        InvoiceStatus;
//   currency:      string;
//   subTotal:      number;
//   taxTotal:      number;
//   totalAmount:   number;
//   paymentStatus: 'unpaid'|'paid'|'partiallyPaid'|'refunded';
//   metadata?:     Record<string, any>;
//   createdById?:  string;
//   updatedById?:  string;
//   createdAt:     Date;
//   updatedAt:     Date;
// }

// export interface InvoiceDetailDto extends InvoiceResponseDto {
//   items:    InvoiceItemDto[];
//   payments: Array<{ id:string; amount:number; method:string; paidAt: Date }>;
// }

// export class CreateInvoicePaymentDto {
//   invoiceId: string;
//   amount: number;
//   method: string; // e.g. cash, card, bank-transfer
//   reference?: string;
//   metadata?: any;
// }
