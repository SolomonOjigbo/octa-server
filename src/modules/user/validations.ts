import { z } from "zod";

export const createUserSchema = z.object({
  tenantId: z.string().cuid(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  storeId: z.string().cuid().optional(),
  isRoot: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  id: z.string().cuid(),
  tenantId: z.string().cuid().optional(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(6).optional(),
  storeId: z.string().cuid().optional(),
  isRoot: z.boolean().optional(),
});