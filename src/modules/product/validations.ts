import { z } from 'zod';


// Category schemas
export const createCategorySchema = z.object({
  tenantId: z.string().cuid(),
  name: z.string().min(2),
  description: z.string().optional(),
});
export const updateCategorySchema = createCategorySchema.partial();

// Variant schema
export const variantSchema = z.object({
  id: z.string().cuid().optional(),
  attributes: z.record(z.any()),           // ensure it's an object
  priceDelta: z.number().nonnegative().optional(),
  barcode: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().transform(d => new Date(d)).optional(),
});

// Main product schemas
export const createProductSchema = z.object({
  tenantId: z.string().cuid(),
  categoryId: z.string().cuid().optional(),
  // Inline create category?
  category: createCategorySchema.optional(),

  name: z.string().min(1),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().optional(),

  costPrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),

  threshold: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),

  variants: z.array(variantSchema).optional(),
});
export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().uuid(),
});;


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
