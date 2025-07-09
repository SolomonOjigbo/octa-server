import { z } from 'zod';

export const TenantCategorySchema = z.object({
  name: z.string().min(1),
  parentId: z.string().cuid().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export const TenantProductSchema = z.object({
  globalProductId: z.string().cuid().optional(),
  tenantCategoryId: z.string().cuid().optional(),
  barcode: z.string().optional(),  
  imageUrl: z.string().optional(),
  brand: z.string().optional(),
  sku: z.string().optional(),
  name: z.string().optional(),
  isTransferable: z.boolean().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),         
  deletedAt: z.coerce.date().optional(),    
});

export const TenantVariantSchema = z.object({
  tenantProductId: z.string().cuid(),
  name: z.string().min(1),
  imageUrl: z.string().url().optional(),  
  sku: z.string().min(1),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  stock: z.number().int().min(0).optional(),
});
