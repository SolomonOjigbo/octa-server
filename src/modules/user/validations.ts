import { z } from "zod";

export const createUserSchema = z.object({
  tenantId: z.string().cuid(),
  storeId: z.string().cuid().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),

});

export const updateUserSchema = z.object({
  storeId: z.string().cuid().optional(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(6).optional(),
  isActive: z.boolean().optional(),
});
