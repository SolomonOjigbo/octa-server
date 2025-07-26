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
  createdAt: z.date()
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const createProductSupplierSchema = z.object({
  supplierId: z.string().cuid(),
  tenantProductId: z.string().cuid(),
  price: z.number().min(0).optional(),
  isGlobal: z.boolean(),
  leadTime: z.number().int().optional(),
});

export const updateProductSupplierSchema = createProductSupplierSchema.partial();

// export const SupplierCreateDtoSchema = z.object({
//   tenantId: z.string(),
//   name: z.string().min(1),
//   email: z.string().email().optional(),
//   phone: z.string().optional(),
//   address: z.string().optional(),
//   leadTime: z.number().int().positive().optional(),
//   paymentTerms: z.string().optional(),
//   notes: z.string().optional(),
// });

// export const SupplierUpdateDtoSchema = SupplierCreateDtoSchema.partial();

// export const ProductSupplierDtoSchema = z.object({
//   tenantId: z.string(),
//   supplierId: z.string(),
//   tenantProductId: z.string(),
//   isGlobal: z.boolean().optional(),
//   price: z.number().optional(),
//   leadTime: z.number().int().optional(),
// });
