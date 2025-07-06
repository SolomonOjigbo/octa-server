

import { z } from "zod";

export const createBusinessEntitySchema = z.object({
  tenantId: z.string().cuid(),
  name: z.string().min(2),
  taxId: z.string().optional(),
  legalAddress: z.string().optional(),
});

export const updateBusinessEntitySchema = createBusinessEntitySchema.partial();
