import { z } from "zod";


export const createUserSchema = z.object({
  tenantId: z.string().cuid(),
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  phone: z.string().regex(/^\+?[\d\s-]{6,15}$/).optional(),
  password: z.string().min(8).max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
    }),
  storeId: z.string().cuid().optional(),
  isRoot: z.boolean().optional(),
  isActive: z.boolean().optional().default(true)
});

export const updateUserSchema = z.object({
  tenantId: z.string().cuid().optional(),
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().regex(/^\+?[\d\s-]{6,15}$/).optional(),
  password: z.string().min(8).max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .optional(),
  currentPassword: z.string().min(8).optional(),
  storeId: z.string().cuid().optional(),
  isRoot: z.boolean().optional(),
  isActive: z.boolean().optional()
}).partial().refine(data => {
  if (data.password && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: "Current password is required when changing password",
  path: ["currentPassword"]
});