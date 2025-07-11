// src/modules/invoice/validations.ts
import { z } from 'zod';

export const ListInvoicesQuerySchema = z.object({
  status:      z.enum(['draft','issued','paid','partiallyPaid','overdue','cancelled']).optional(),
  referenceType: z.enum(['purchaseOrder','posTransaction','stockTransfer','b2bConnection']).optional(),
  referenceId: z.string().cuid().optional(),
  customerId:  z.string().cuid().optional(),
  startDate:   z.coerce.date().optional(),
  endDate:     z.coerce.date().optional(),
  page:        z.number().int().min(1).optional(),
  limit:       z.number().int().min(1).optional(),
});

export const CreateInvoiceItemSchema = z.object({
  productId:   z.string().cuid(),
  variantId:   z.string().cuid().optional(),
  description: z.string(),
  quantity:    z.number().int().min(1),
  unitPrice:   z.number().min(0),
  taxAmount:   z.number().min(0),
});

export const CreateInvoiceSchema = z.object({
  referenceType: z.enum(['purchaseOrder','posTransaction','stockTransfer','b2bConnection']),
  referenceId:   z.string().cuid().optional(),
  customerId:    z.string().cuid().optional(),
  dueDate:       z.coerce.date().optional(),
  currency:      z.string().min(3).optional(),
  metadata:      z.record(z.any()).optional(),
  items:         z.array(CreateInvoiceItemSchema).min(1),
});

export const IssueInvoiceSchema = z.object({
  invoiceNo: z.string().min(1),
  dueDate:   z.coerce.date().optional(),
});

export const UpdateInvoiceSchema = z.object({
  dueDate:  z.coerce.date().optional(),
  status:   z.enum(['draft','issued','paid','partiallyPaid','overdue','cancelled']).optional(),
  metadata: z.record(z.any()).optional(),
});

export const ApplyPaymentSchema = z.object({
  paymentId:       z.string().cuid(),
  amount:          z.number().min(0).optional(),
});

export const PdfQuerySchema = z.object({}); // no parameters
