import { z } from "zod";

export const tenantSlugSchema = z.string()
  .min(2)
  .max(50)
  .regex(/^[a-z0-9-]+$/, {
    message: "Slug can only contain lowercase letters, numbers and hyphens"
  });

export const tenantOnboardingSchema = z.object({
  tenant: z.object({
    name: z.string().min(2),
    slug: tenantSlugSchema,
    legalName: z.string().optional(),
    contactEmail: z.string().email().optional(),
  }),
  businessEntity: z.object({
    name: z.string().min(2),
    taxId: z.string().optional(),
    legalAddress: z.string().optional(),
  }),
  store: z.object({
    name: z.string().min(2),
    code: z.string().min(2),
    address: z.string().optional(),
    isMain: z.boolean().optional(),
  }),
  adminUser: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().optional(),
  }),
});


// export const updateTenantSchema = z.object({
//   id: z.string().cuid(),
//   name: z.string().min(2).max(100).optional(),
//   slug: tenantSlugSchema.optional(),
//   legalName: z.string().max(200).optional(),
//   contactEmail: z.string().email().max(100).optional(),
//   branding: z.record(z.unknown()).optional(),
//   settings: z.record(z.unknown()).optional()
// });

export const updateTenantSchema = tenantOnboardingSchema.partial();