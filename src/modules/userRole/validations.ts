import { z } from "zod";

export const assignRoleSchema = z.object({
  userId: z.string().cuid(),
  roleId: z.string().cuid(),
  assignedBy: z.string().cuid().optional(),
});

export const removeRoleSchema = z.object({
  userId: z.string().cuid(),
  roleId: z.string().cuid(),
});
