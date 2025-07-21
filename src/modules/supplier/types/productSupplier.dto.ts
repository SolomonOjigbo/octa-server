import { z } from 'zod';

/**
 * When creating a link, exactly one of `tenantProductId` or `globalProductId` is required.
 */
export const CreateProductSupplierDtoSchema = z
  .object({
    supplierId: z.string().cuid(),
    tenantProductId: z.string().cuid().optional(),
    globalProductId: z.string().cuid().optional(),
    price: z.number().min(0).optional(),
    leadTime: z.number().int().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => Boolean(data.tenantProductId) !== Boolean(data.globalProductId),
    {
      message:
        "Must provide exactly one of 'tenantProductId' or 'globalProductId'",
      path: ['tenantProductId', 'globalProductId'],
    }
  );

export type CreateProductSupplierDto = z.infer<
  typeof CreateProductSupplierDtoSchema
>;

/**
 * When updating, if either product ID is present, they must still be exclusive.
 */
export const UpdateProductSupplierDtoSchema = z.object({
  supplierId: z.string().cuid().optional(),
  tenantProductId: z.string().cuid().optional(),
  globalProductId: z.string().cuid().optional(),
  price: z.number().min(0).optional(),
  leadTime: z.number().int().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    if (
      data.tenantProductId === undefined &&
      data.globalProductId === undefined
    ) {
      return true;
    }
    return Boolean(data.tenantProductId) !== Boolean(data.globalProductId);
  },
  {
    message:
      "When updating, you must provide exactly one of 'tenantProductId' or 'globalProductId'",
    path: ['tenantProductId', 'globalProductId'],
  }
);

export type UpdateProductSupplierDto = z.infer<
  typeof UpdateProductSupplierDtoSchema
>;
