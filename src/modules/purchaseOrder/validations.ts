// This file contains validation schemas for purchase orders and their items using Zod.
// It defines the structure and constraints for creating, updating, and managing purchase orders in a system

// src/modules/purchaseOrder/validations.ts

import { z } from 'zod';

export const PurchaseOrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().min(1),
  costPrice: z.number().min(0),
  batchNumber: z.string().optional(),
  expiryDate: z.coerce.date().optional(),
  isControlled: z.boolean().optional(),
});

export const CreatePurchaseOrderSchema = z.object({
  tenantId: z.string().min(1),
  supplierId: z.string().min(1),
  storeId: z.string().optional(),
  warehouseId: z.string().optional(),
  orderDate: z.coerce.date(),
  totalAmount: z.number().min(0),
  notes: z.string().optional(),
  requestedBy: z.string().min(1),
  // Ensure at least one item is present in the purchase order
  items: z.array(PurchaseOrderItemSchema).min(1),
  pharmacistId: z.string().min(1).optional(), // Optional for controlled substances


});

export const UpdatePurchaseOrderSchema = z.object({
  status: z.enum(['pending', 'approved', 'received', 'cancelled']).optional(),
  notes: z.string().optional(),
  receivedDate: z.coerce.date().optional(),
  updatedBy: z.string().min(1),
});

export const CancelPurchaseOrderSchema = z.object({
  reason: z.string().optional(),
  cancelledBy: z.string().min(1),
});

export const LinkPaymentSchema = z.object({
  paymentId: z.string().min(1),
  amount: z.number().min(0),
  linkedBy: z.string().min(1),
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