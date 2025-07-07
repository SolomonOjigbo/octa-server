import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().min(2),
  tenantId: z.string().cuid().optional(),
  storeId: z.string().cuid().optional(),
  warehouseId: z.string().cuid().optional(),
  permissionIds: z.array(z.string().cuid()).nonempty(),
});

export const updateRoleSchema = createRoleSchema.partial();


// export const updateRoleSchema = z.object({
//   id: z.string().cuid(),
//   name: z.string().min(2).optional(),
//   tenantId: z.string().cuid().optional(),
//   storeId: z.string().cuid().optional(),
//   warehouseId: z.string().cuid().optional(),
//   permissionIds: z.array(z.string().cuid()).optional(),
// });

export const assignRoleSchema = z.object({
userId: z.string().cuid(),
  roleId: z.string().cuid(),
  assignedBy: z.string().cuid().optional(),
});