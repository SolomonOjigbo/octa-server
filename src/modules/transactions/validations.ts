// src/modules/transactions/validations.ts
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



const ReferenceTypeEnum = z.enum([
  'purchaseOrder', 'posTransaction', 'stockTransfer', 'b2bConnection'
]);

const StatusEnum = z.enum(['pending','posted','failed','voided']);
const PaymentStatusEnum = z.enum([
  'unpaid','paid','partiallyPaid','refunded'
]);

export const CreateTransactionSchema = z.object({
  referenceType:  ReferenceTypeEnum,
  referenceId:    z.string().cuid().optional(),
  amount:         z.number().min(0),
  date:           z.coerce.date().default(() => new Date()),
  status:         StatusEnum.default('pending'),
  paymentStatus:  PaymentStatusEnum.default('unpaid'),
  metadata:       z.record(z.any()).optional(),
});

export const UpdateTransactionSchema = CreateTransactionSchema.partial();
