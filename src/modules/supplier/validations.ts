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

export const SupplierCreateDtoSchema = z.object({
  tenantId: z.string(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  leadTime: z.number().int().positive().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

export const SupplierUpdateDtoSchema = SupplierCreateDtoSchema.partial();

export const ProductSupplierDtoSchema = z.object({
  tenantId: z.string(),
  supplierId: z.string(),
  productId: z.string(),
  isGlobal: z.boolean().optional(),
});
