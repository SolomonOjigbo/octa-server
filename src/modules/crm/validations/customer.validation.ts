import { z } from "zod";


export const CreateCustomerSchema = z.object({
  tenantId: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  segment: z.string().optional(),
  tags: z.array(z.string()).optional(),
  linkedTenantId: z.string().optional(),
});
