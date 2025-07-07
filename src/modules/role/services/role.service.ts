import { PrismaClient } from "@prisma/client";
import { CreateRoleDto, AssignRoleDto } from "../types/role.dto";

const prisma = new PrismaClient();

export class RoleService {
  async createRole(dto: CreateRoleDto) {
    return prisma.role.create({
      data: {
        name: dto.name,
        tenantId: dto.tenantId,
        storeId: dto.storeId,
        warehouseId: dto.warehouseId,
        permissions: {
          connect: dto.permissionIds.map(id => ({ id })),
        },
      },
      include: { permissions: true },
    });
  }

  async assignRole(dto: AssignRoleDto) {
    return prisma.userRole.create({
      data: {
        userId: dto.userId,
        roleId: dto.roleId,
        assignedBy: dto.assignedBy,
      },
    });
  }

  async getUserPermissions(userId: string, tenantId?: string, storeId?: string, warehouseId?: string) {
    // Get all user roles in this context (tenant/store/warehouse)
    const roles = await prisma.userRole.findMany({
      where: { userId, role: { tenantId, storeId, warehouseId } },
      include: { role: { include: { permissions: true } } },
    });
    // Flatten to a unique permission set
    const permissionSet = new Set<string>();
    for (const ur of roles) {
      for (const perm of ur.role.permissions) {
        permissionSet.add(perm.name);
      }
    }
    return Array.from(permissionSet);
  }

  async getRoleById (id: string) {
    return prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
  }

}

export const roleService = new RoleService();
