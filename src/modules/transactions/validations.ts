import { z } from "zod";

export const getTransactionFiltersSchema = z.object({
  tenantId: z.string().cuid(),
  storeId: z.string().cuid().optional(),
  customerId: z.string().cuid().optional(),
  sessionId: z.string().cuid().optional(),
  status: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const updateTransactionStatusSchema = z.object({
  status: z.string(),
});
export const createTransactionSchema = z.object({
  tenantId: z.string().cuid(),
  storeId: z.string().cuid(),
  customerId: z.string().cuid().optional(),
  sessionId: z.string().cuid().optional(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  status: z.string().optional(),
  reference: z.string().optional(),
  date: z.string().datetime().optional(),
});