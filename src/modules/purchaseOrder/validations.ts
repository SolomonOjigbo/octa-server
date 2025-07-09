// This file contains validation schemas for purchase orders and their items using Zod.
// It defines the structure and constraints for creating, updating, and managing purchase orders in a system

// src/modules/purchaseOrder/validations.ts
import { z } from 'zod';


export const PurchaseOrderItemSchema = z.object({
  tenantProductId:        z.string().cuid(),
  tenantProductVariantId: z.string().cuid().optional(),
  quantity:               z.number().int().min(1),
  costPrice:              z.number().min(0),
  batchNumber:            z.string().optional(),
  expiryDate:             z.coerce.date().optional(),
});

export const CreatePurchaseOrderSchema = z.object({
  supplierId:   z.string().cuid(),
  storeId:      z.string().cuid().optional(),
  warehouseId:  z.string().cuid().optional(),
  orderDate:    z.coerce.date(),
  receivedDate: z.coerce.date().optional(),
  totalAmount:  z.number().min(0),
  notes:        z.string().optional(),
  items:        z.array(PurchaseOrderItemSchema).min(1),
});


export const CancelPurchaseOrderSchema = z.object({
  reason: z.string().optional(),
});

export const LinkPaymentSchema = z.object({
  paymentId: z.string().cuid(),
  amount:    z.number().min(0),
});


export const UpdatePurchaseOrderSchema = z.object({
  status: z.enum(['pending', 'approved', 'received', 'cancelled']).optional(),
  notes: z.string().optional(),
  receivedDate: z.coerce.date().optional(),
  updatedBy: z.string().min(1),
});

export const listPurchaseOrderFilterSchema = z.object({
  tenantId: z.string().min(1),
  storeId: z.string().optional(),
  warehouseId: z.string().optional(),
  status: z.enum(['pending', 'approved', 'received', 'cancelled']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  supplierId: z.string().optional(),
  requestedBy: z.string().optional(),
})

export const CreateControlledSubstanceSchema = z.object({
  tenantId: z.string().min(1),
  supplierId: z.string().min(1),
  storeId: z.string().optional(), 
  warehouseId: z.string().optional(),
  orderDate: z.coerce.date(),
  receivedDate: z.coerce.date().optional(),
  totalAmount: z.number().min(0),
  notes: z.string().optional(),
  requestedBy: z.string().min(1),
  items: z.array(PurchaseOrderItemSchema).min(1),
  pharmacistId: z.string().min(1),
});

export const ListPurchaseOrderSchema = z.object({
  tenantId: z.string().min(1),
  storeId: z.string().optional(),
  warehouseId: z.string().optional(),
  status: z.enum(['pending', 'approved', 'received', 'cancelled']).optional(),
  orderDate: z.coerce.date().optional(),
  receivedDate: z.coerce.date().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  supplierId: z.string().optional(),
  requestedBy: z.string().optional(),
});