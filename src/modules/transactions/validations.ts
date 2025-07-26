// src/modules/transactions/validations.ts
import { TransactionReferenceType } from "@prisma/client";
import { z } from "zod";
import { PaymentStatus, TransactionStatus } from "./types/transaction.dto";




// const ReferenceTypeEnum = z.enum([
//   'purchaseOrder', 'posTransaction', 'stockTransfer', 'b2bConnection'
// ]);

// const TransactionStatus = z.enum(['pending','posted','failed','voided']);
// const TransactionPaymentStatus = z.enum([
  //   'unpaid','paid','partiallyPaid','refunded'
// ]);


export const CreateTransactionSchema = z.object({
  storeId:        z.string().cuid().optional(),
  warehouseId:    z.string().cuid().optional(),
  customerId:     z.string().cuid().optional(),
  amount:         z.number().min(0),
  discount:       z.number().min(0).optional(),
  taxAmount:      z.number().min(0).optional(),
  referenceType:  z.nativeEnum(TransactionReferenceType),
  referenceId:    z.string().cuid().optional(),
  shippingFee:    z.number().min(0).optional(),
  shippingType:   z.string().optional(),
  shippingAddress:z.string().optional(),
  metadata:       z.record(z.any()).optional(),
  paymentMethod:  z.string(),
  paymentStatus:  z.nativeEnum(PaymentStatus).default(PaymentStatus.UNPAID),
  status:         z.nativeEnum(TransactionStatus).default(TransactionStatus.POSTED),
  posSessionId:   z.string().cuid().optional(),
});

export const UpdateTransactionSchema = CreateTransactionSchema.partial();

export const getTransactionFiltersSchema = z.object({
  tenantId: z.string().cuid(),
  storeId: z.string().cuid().optional(),
  customerId: z.string().cuid().optional(),
  sessionId: z.string().cuid().optional(),
  status: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});
