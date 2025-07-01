import { z } from "zod";

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

export const createProductSchema = z.object({
  tenantId: z.string().cuid(),
  name: z.string().min(2),
  sku: z.string().min(2),
  barcode: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  categoryId: z.string().cuid().optional(),
  costPrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  isActive: z.boolean().optional(),
  dosageForm: z.string().optional(),
  strength: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
  variants: z.array(createProductVariantSchema).optional(),
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

export const updateProductSchema = createProductSchema.partial();
export const updateProductCategorySchema = createProductCategorySchema.partial();
export const updateProductVariantSchema = createProductVariantSchema.partial();
