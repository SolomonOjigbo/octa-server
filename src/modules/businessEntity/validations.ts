import { z } from 'zod';

export const createBusinessEntitySchema = z.object({
  tenantId: z.string().cuid(),
  name: z.string().min(2),
  taxId: z.string().optional(),
  legalAddress: z.string().optional(),
});

export const updateBusinessEntitySchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(2).optional(),
  taxId: z.string().optional(),
  legalAddress: z.string().optional(),
});