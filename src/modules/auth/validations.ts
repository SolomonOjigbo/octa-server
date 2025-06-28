import { z } from "zod";

// Common validation patterns
const cuidSchema = z.string().cuid();
const emailSchema = z.string().email();
const passwordSchema = z.string().min(8).max(100);

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1)
});

export const inviteUserSchema = z.object({
  tenantId: cuidSchema,
  email: emailSchema,
  name: z.string().min(2).max(100).optional(),
  roleId: cuidSchema.optional()
});

export const activateUserSchema = z.object({
  inviteToken: z.string().min(1),
  password: passwordSchema,
  name: z.string().min(2).max(100).optional()
});

export const requestPasswordResetSchema = z.object({
  email: emailSchema
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema
});