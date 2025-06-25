import { z } from "zod";

export const createCustomerSchema = z.object({
  tenantId: z.string().cuid(),
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  loyaltyNumber: z.string().optional(),
  segment: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createCommunicationLogSchema = z.object({
  tenantId: z.string().cuid(),
  method: z.string(),
  content: z.string().min(2),
  direction: z.enum(["inbound", "outbound"]),
  userId: z.string().cuid().optional(),
  customerId: z.string().cuid().optional(),
  supplierId: z.string().cuid().optional(),
});
export const updateCommunicationLogSchema = createCommunicationLogSchema.partial();