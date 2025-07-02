import { z } from 'zod';

export const createProductSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  categoryId: z.string().uuid(),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  isActive: z.boolean().optional(),
  variants: z.array(z.object({
    name: z.string(),
    sku: z.string().optional(),
    costPrice: z.number().min(0),
    sellingPrice: z.number().min(0),
    stock: z.number().min(0).optional(),
  })).optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().uuid(),
});

export const productFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  brand: z.string().optional(),
  isActive: z.boolean().optional(),
  withStock: z.boolean().optional(),
  withVariants: z.boolean().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  fields: z.string().optional(),
});

export const productIdParamSchema = z.object({
  id: z.string().uuid()
});


export const createProductCategorySchema = z.object({
  tenantId: z.string().cuid(),
  name: z.string().min(2),
  description: z.string().optional(),
});

export const createProductVariantSchema = z.object({
  tenantId: z.string().cuid(),
  productId: z.string().cuid(),
  name: z.string().min(2),
  sku: z.string().min(2),
  barcode: z.string().optional(),
  costPrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  isActive: z.boolean().optional(),
});


// Base schemas for validation
export const ProductCategorySchema = z.object({
  tenantId: z.string().cuid(),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export const ProductVariantSchema = z.object({
  tenantId: z.string().cuid(),
  productId: z.string().cuid(),
  name: z.string().min(2).max(100),
  sku: z.string().min(2).max(50),
  barcode: z.string().max(50).optional(),
  costPrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  isActive: z.boolean().optional().default(true),
});

export const ProductSchema = z.object({
  tenantId: z.string().cuid(),
  categoryId: z.string().cuid().optional(),
  name: z.string().min(2).max(100),
  sku: z.string().min(2).max(50),
  barcode: z.string().max(50).optional(),
  description: z.string().max(1000).optional(),
  brand: z.string().max(50).optional(),
  costPrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  isActive: z.boolean().optional().default(true),
  dosageForm: z.string().max(50).optional(),
  strength: z.string().max(50).optional(),
  batchNumber: z.string().max(50).optional(),
  expiryDate: z.string().datetime().optional(),
  variants: z.array(ProductVariantSchema).optional(),
});


export const updateProductCategorySchema = createProductCategorySchema.partial();
export const updateProductVariantSchema = createProductVariantSchema.partial();
