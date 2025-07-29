// src/modules/invoice/validations.ts
import { z } from 'zod';

const StatusEnum = z.enum(['DRAFT', 'ISSUED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED']);
const ReferenceTypeEnum = z.enum(['PURCHASE_ORDER', 'POS_TRANSACTION', 'STOCK_TRANSFER', 'B2B_CONNECTION']);
const PaymentMethodEnum = z.enum(['CASH', 'CARD', 'TRANSFER', 'WALLET', 'INVOICE']);

export const ListInvoicesQuerySchema = z.object({
  status: StatusEnum.optional(),
  referenceType: ReferenceTypeEnum.optional(),
  referenceId: z.string().cuid().optional(),
  customerId: z.string().cuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).optional(),
});

export const CreateInvoiceItemSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional(),
  description: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  taxAmount: z.number().min(0),
});

export const CreateInvoiceSchema = z.object({
  referenceType: ReferenceTypeEnum,
  referenceId: z.string().cuid().optional(),
  customerId: z.string().cuid().optional(),
  dueDate: z.coerce.date().optional(),
  currency: z.string().min(3).optional(),
  metadata: z.record(z.any()).optional(),
  items: z.array(CreateInvoiceItemSchema).min(1),
});

export const IssueInvoiceSchema = z.object({
  invoiceNo: z.string().min(1),
  dueDate: z.coerce.date().optional(),
});

export const UpdateInvoiceSchema = z.object({
  dueDate: z.coerce.date().optional(),
  status: StatusEnum.optional(),
  metadata: z.record(z.any()).optional(),
});

export const ApplyPaymentSchema = z.object({
  amount: z.number().min(0).optional(),
  method: PaymentMethodEnum.optional(),
  reference: z.string().optional(),
});

export const CreateInvoicePaymentSchema = z.object({
  invoiceId: z.string().cuid(),
  amount: z.number().min(0),
  method: PaymentMethodEnum,
  reference: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const PdfQuerySchema = z.object({});





// export const ListInvoicesQuerySchema = z.object({
//   status:      z.enum(['draft','issued','paid','partiallyPaid','overdue','cancelled']).optional(),
//   referenceType: z.enum(['purchaseOrder','posTransaction','stockTransfer','b2bConnection']).optional(),
//   referenceId: z.string().cuid().optional(),
//   customerId:  z.string().cuid().optional(),
//   startDate:   z.coerce.date().optional(),
//   endDate:     z.coerce.date().optional(),
//   page:        z.number().int().min(1).optional(),
//   limit:       z.number().int().min(1).optional(),
// });

// export const CreateInvoiceItemSchema = z.object({
//   productId:   z.string().cuid(),
//   variantId:   z.string().cuid().optional(),
//   description: z.string(),
//   quantity:    z.number().int().min(1),
//   unitPrice:   z.number().min(0),
//   taxAmount:   z.number().min(0),
// });

// export const CreateInvoiceSchema = z.object({
//   referenceType: z.enum(['purchaseOrder','posTransaction','stockTransfer','b2bConnection']),
//   referenceId:   z.string().cuid().optional(),
//   customerId:    z.string().cuid().optional(),
//   dueDate:       z.coerce.date().optional(),
//   currency:      z.string().min(3).optional(),
//   metadata:      z.record(z.any()).optional(),
//   items:         z.array(CreateInvoiceItemSchema).min(1),
// });

// export const IssueInvoiceSchema = z.object({
//   invoiceNo: z.string().min(1),
//   dueDate:   z.coerce.date().optional(),
// });

// export const UpdateInvoiceSchema = z.object({
//   dueDate:  z.coerce.date().optional(),
//   status:   z.enum(['draft','issued','paid','partiallyPaid','overdue','cancelled']).optional(),
//   metadata: z.record(z.any()).optional(),
// });

// export const ApplyPaymentSchema = z.object({
//   paymentId:       z.string().cuid(),
//   amount:          z.number().min(0).optional(),
// });

// export const PdfQuerySchema = z.object({}); 
