// src/modules/supplier/validations.ts

import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(7).optional(),
  address: z.string().optional(),
  leadTime: z.number().int().optional(),
  performanceMetrics: z.record(z.any()).optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const createProductSupplierSchema = z.object({
  supplierId: z.string().cuid(),
  productId: z.string().cuid(),
  price: z.number().min(0),
  currency: z.string().length(3),
  leadTime: z.number().int().optional(),
});

export const updateProductSupplierSchema = createProductSupplierSchema.partial();
