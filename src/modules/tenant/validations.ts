import { z } from "zod";

export const createTenantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  legalName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  branding: z.any().optional(),
  settings: z.any().optional(),
});

export const updateTenantSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  legalName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  branding: z.any().optional(),
  settings: z.any().optional(),
});