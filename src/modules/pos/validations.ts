// src/modules/pos/validations.ts
import { z } from 'zod';

export const OpenSessionSchema = z.object({ 
  storeId: z.string().cuid(),
  openingBalance: z.number().min(0),
  notes: z.string().optional(),
});

export const CloseSessionSchema = z.object({  
  closingCash: z.number().min(0),  
  notes:       z.string().optional(), 
  userId:     z.string().cuid().optional(),
});

export const SaleItemSchema = z.object({
  tenantProductId:        z.string().cuid(),
  tenantProductVariantId: z.string().cuid().optional(),
  quantity:               z.number().int().min(1),
  unitPrice:              z.number().min(0),
  name:                 z.string(), 
  sku:                 z.string(),
  discount:               z.number().min(0).optional(),
  tax:                    z.number().min(0).optional(),
});

export const CreateTransactionSchema = z.object({
  sessionId: z.string().cuid(),
  customerId: z.string().cuid().optional(),
  items: z.array(SaleItemSchema).min(1),
  paymentMethod: z.string(),
  cashReceived: z.number().min(0).optional(),
  amount:  z.number().min(0)
});

export const CreatePaymentSchema = z.object({
  transactionId: z.string().cuid(),
  amount:        z.number().min(0),
  method:        z.string(),
  reference:     z.string().optional(),
});

export const CreateSalesReturnSchema = z.object({
  transactionId: z.string().cuid(),
  items: z.array(z.object({
    tenantProductId:        z.string().cuid(),
    tenantProductVariantId: z.string().cuid().optional(),
    quantity:               z.number().int().min(1),
    reason:                 z.string().optional(),
  })).min(1),
});

export const CreateCashDropSchema = z.object({
  sessionId: z.string().cuid(),
  amount:    z.number().min(0),
  reason:    z.string().optional(),
});

export const ReconcileCashSchema = z.object({
  sessionId:          z.string().cuid(),
  countedCashAmount:  z.number().min(0),
  varianceReason:     z.string().optional(),
});
