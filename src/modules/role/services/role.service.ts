import prisma from "@shared/infra/database/prisma";
import { CreateRoleDto, UpdateRoleDto } from "../types/role.dto";



export class RoleService {
  async createRole(dto: CreateRoleDto) {
    // Optionally ensure tenant/store/warehouse exist
    if (dto.tenantId) {
      const t = await prisma.tenant.findUnique({ where: { id: dto.tenantId } });
      if (!t) throw new Error("Invalid tenantId.");
    }
    if (dto.storeId) {
      const s = await prisma.store.findUnique({ where: { id: dto.storeId } });
      if (!s) throw new Error("Invalid storeId.");
    }
    if (dto.warehouseId) {
      const w = await prisma.warehouse.findUnique({ where: { id: dto.warehouseId } });
      if (!w) throw new Error("Invalid warehouseId.");
    }
    // Create role with permissions
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

  async updateRole(id: string, dto: UpdateRoleDto) {
    return prisma.role.update({
      where: { id },
      data: {
        ...dto,
        permissions: dto.permissionIds
          ? { set: dto.permissionIds.map(id => ({ id })) }
          : undefined,
      },
      include: { permissions: true },
    });
  }

  async deleteRole(id: string) {
    return prisma.role.delete({ where: { id } });
  }

  async getRoles(context: { tenantId?: string; storeId?: string; warehouseId?: string }) {
    return prisma.role.findMany({
      where: context,
      include: { permissions: true },
    });
  }
  async getRoleByName(name: string, context: { tenantId?: string; storeId?: string; warehouseId?: string }) {
    return prisma.role.findUnique({
      where: { name,...context },
      include: { permissions: true },
    });
  }

  async getRoleById(id: string) {
    return prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
  }
}

export const roleService = new RoleService();
