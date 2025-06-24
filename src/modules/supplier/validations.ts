// validations.ts
import { z } from "zod";
export const createSupplierSchema = z.object({
  tenantId: z.string().cuid(),
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  paymentTerms: z.string().optional(),
  leadTime: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});
export const updateSupplierSchema = createSupplierSchema.partial();