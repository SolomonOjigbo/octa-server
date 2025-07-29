import { z } from 'zod';

export const TenantCategorySchema = z.object({
  name: z.string().min(1),
  parentId: z.string().cuid().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
});
export const TenantVariantSchema = z.object({
  tenantProductId: z.string().cuid(),
  name: z.string().min(1),
  imageUrl: z.string().url().optional(),  
  sku: z.string().min(1),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  stock: z.number().int().min(0).optional(),
   variantAttributes: z.array(
      z.object({
        id: z.string().cuid(),
        name: z.string().min(1),
        options: z.array(z.string().min(1)).min(1)
      })
    ).nonempty(),
});

export const TenantProductSchema = z.object({
  globalProductId: z.string().cuid().optional(),
  tenantCategoryId: z.string().cuid().optional(),
  barcode: z.string().optional(),  
  imageUrl: z.string().optional(),
  brand: z.string().optional(),
  sku: z.string().optional(),
  name: z.string().optional(),
  sellingPrice: z.number().nonnegative().optional(),
  costPrice: z.number().nonnegative().optional(),
  isTransferable: z.boolean().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),         
  deletedAt: z.coerce.date().optional(),    
  isVariable: z.boolean(),
  variants: z.array(TenantVariantSchema).optional()
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

