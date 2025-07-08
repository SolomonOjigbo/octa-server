import { z } from 'zod';

export const GlobalCategorySchema = z.object({
  name: z.string().min(1),
  parentId: z.string().cuid().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const GlobalProductSchema = z.object({
  globalCategoryId: z.string().cuid(),
  sku: z.string().min(1),
  name: z.string().min(1),
   imageUrl: z.string().optional(),
   barcode: z.string().optional(),
  dosageForm: z.string().optional(),
  strength: z.string().optional(),
  isPrescription: z.boolean().optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
});

export const GlobalProductVariantSchema = z.object({
  globalProductId: z.string().cuid(),
  name: z.string().min(1),
  sku: z.string().min(1),
  imageUrl: z.string().optional(),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  stock: z.number().int().min(0).optional(),
});
