// src/modules/crm/validations.ts

import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  address: z.string().optional(),
  gender: z.enum(['male','female','other']).optional(),
  dateOfBirth: z.string().optional(),
  isActive: z.boolean().default(true),
  loyaltyNumber: z.string().optional(),
  segment: z.string().optional(),
  tags: z.array(z.string()).optional(),
  defaultPaymentTerm: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createCommunicationLogSchema = z.object({
  method: z.string(),
  content: z.string(),
  direction: z.enum(['inbound','outbound']),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
});

export const updateCommunicationLogSchema = createCommunicationLogSchema.partial();