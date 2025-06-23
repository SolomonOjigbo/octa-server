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

export const updateProductSchema = createProductSchema.partial();
export const updateProductCategorySchema = createProductCategorySchema.partial();
export const updateProductVariantSchema = createProductVariantSchema.partial();
