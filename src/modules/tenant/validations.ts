import { z } from "zod";

export const tenantSlugSchema = z.string()
  .min(2)
  .max(50)
  .regex(/^[a-z0-9-]+$/, {
    message: "Slug can only contain lowercase letters, numbers and hyphens"
  });

export const createTenantSchema = z.object({
  name: z.string().min(2).max(100),
  slug: tenantSlugSchema,
  legalName: z.string().max(200).optional(),
  contactEmail: z.string().email().max(100).optional(),
  branding: z.record(z.unknown()).optional(),
  settings: z.record(z.unknown()).optional(),
  adminUser: z.object({
    email: z.string().email(),
    name: z.string().min(2),
    password: z.string().min(8)
  }).optional()
});

export const updateTenantSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(2).max(100).optional(),
  slug: tenantSlugSchema.optional(),
  legalName: z.string().max(200).optional(),
  contactEmail: z.string().email().max(100).optional(),
  branding: z.record(z.unknown()).optional(),
  settings: z.record(z.unknown()).optional()
});