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
  variantAttributes: z.array(
    z.object({
      id: z.string().cuid(),
      name: z.string().min(1),
      options: z.array(z.string().min(1)).min(1)
    })
  ).nonempty(),
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
  sellingPrice: z.number().nonnegative().optional(),
  costPrice: z.number().nonnegative().optional(),
  sellingType: z.string().optional(),
   variants: z.array(createGlobalVariantSchema).optional(),
  description: z.string().optional(),
  isPrescription: z.boolean().optional(),
  isVariable: z.boolean().optional(),
  isActive: z.boolean().optional(),
}).superRefine((data, ctx) => {
  // Validate pricing based on product type
  if (data.isVariable) {
    // Variable products must have variants with pricing
    if (data.costPrice !== undefined || data.sellingPrice !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Variable products should not have direct pricing - set prices at variant level",
        path: ["costPrice"]
      });
    }
    if (!data.variants || data.variants.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Variable products must have at least one variant",
        path: ["variants"]
      });
    }
  } else {
    // Simple products must have direct pricing
    if (data.costPrice === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Simple products must have a cost price",
        path: ["costPrice"]
      });
    }
    if (data.sellingPrice === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Simple products must have a selling price",
        path: ["sellingPrice"]
      });
    }
    if (data.variants && data.variants.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Simple products cannot have variants",
        path: ["variants"]
      });
    }
  }
});

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
  isPrescription: z.boolean().optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  variants: z.array(GlobalProductVariantSchema).optional(),
  isVariable: z.boolean().optional(),
  isActive: z.boolean().optional(),        
  deletedAt: z.coerce.date().optional(), 
});

