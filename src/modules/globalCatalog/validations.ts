import { z } from 'zod';



export const createGlobalCategorySchema = z.object({
  name: z.string().min(1),
  imageUrl: z.string().url().optional(),
  parentId: z.string().cuid().optional(),
  description: z.string().optional(),
});
export const updateGlobalCategorySchema = createGlobalCategorySchema.extend({
  id: z.string().cuid(),
});

export const createGlobalVariantSchema = z.object({
  globalProductId: z.string().cuid(),
  variantAttributeIds: z.array(z.string().cuid()).nonempty(),
  name: z.string().min(1),
  sku: z.string().min(1),
  imageUrl: z.string().url().optional(),
  costPrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  stock: z.number().int().nonnegative().optional(),
});
export const createGlobalProductSchema = z.object({
  globalCategoryId: z.string().cuid(),
  sku: z.string().min(1),
  name: z.string().min(1),
  barcode: z.string().optional(),
  imageUrl: z.string().url().optional(),
  brand: z.string().optional(),
  dosageForm: z.string().optional(),
  strength: z.string().optional(),
  sellingType: z.string().optional(),
   variants: z.array(createGlobalVariantSchema).optional(),
  description: z.string().optional(),
  isPrescription: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export const updateGlobalVariantSchema = createGlobalProductSchema.extend({
  id: z.string().cuid(),
}).partial();

export const updateVariantSchema = createGlobalVariantSchema
  .omit({ globalProductId: true })
  .extend({ id: z.string().cuid() })
  .partial();




export const GlobalProductVariantSchema = z.object({
  globalProductId: z.string().cuid(),
  name: z.string().min(1),
  sku: z.string().min(1),
  attributes: z.object({}).optional(),
  imageUrl: z.string().optional(),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  stock: z.number().int().min(0).optional(),
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
  variants: z.array(GlobalProductVariantSchema).optional(),
  isActive: z.boolean().optional(),        
  deletedAt: z.coerce.date().optional(), 
});

