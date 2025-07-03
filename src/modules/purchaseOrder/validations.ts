// This file contains validation schemas for purchase orders and their items using Zod.
// It defines the structure and constraints for creating, updating, and managing purchase orders in a system

import { z } from "zod";

// Item validation
export const createPurchaseOrderItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive(),
  costPrice: z.number().nonnegative(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
});

// PO validation
export const createPurchaseOrderSchema = z.object({
  tenantId: z.string().cuid(),
  supplierId: z.string().cuid(),
  storeId: z.string().cuid().optional(),
  warehouseId: z.string().cuid().optional(),
  orderDate: z.string().datetime(),
  items: z.array(createPurchaseOrderItemSchema).min(1),
  totalAmount: z.number().nonnegative(),
  notes: z.string().optional(),
  status: z.enum(["pending", "approved", "received", "cancelled"]).default("pending"),
  paidAmount: z.number().nonnegative().default(0),
  payments: z.array(z.object({
    id: z.string().cuid(),
    amount: z.number().nonnegative(),
    method: z.string().min(1),
    status: z.enum(["pending", "completed", "failed"]),
    paidAt: z.string().datetime().optional(),
  })).optional().default([]),
  createdAt: z.string().datetime().optional(),
  requestedBy: z.string().cuid().optional(),
  approvedBy: z.string().cuid().optional(),
  receivedBy: z.string().cuid().optional(),
  cancelledBy: z.string().cuid().optional(),
  reason: z.string().optional(),
});

export const updatePurchaseOrderSchema = z.object({
  status: z.enum(["pending", "approved", "received", "cancelled"]).optional(),
  receivedDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  updatedBy: z.string().cuid().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const cancelPurchaseOrderSchema = z.object({
  cancelledBy: z.string().cuid(),
  reason: z.string().optional(),
});

export const linkPaymentSchema = z.object({
  paymentId: z.string().cuid(),
  amount: z.number().nonnegative(),
  linkedBy: z.string().cuid().optional(),
});
