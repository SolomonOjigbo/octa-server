import prisma from "@shared/infra/database/prisma";



export class PermissionService {
  async createPermission(name: string, description?: string) {
    return prisma.permission.create({ data: { name, description } });
  }
  async getPermissions() {
    return prisma.permission.findMany();
  }
  async updatePermission(id: string, data: { name?: string; description?: string }) {
    return prisma.permission.update({
      where: { id },
      data,
    });
  }
  async getPermissionById(id: string) {
    return prisma.permission.findUnique({ where: { id } });
  }
  async deletePermission(id: string) {
    return prisma.permission.delete({ where: { id } });
  }
  async listAllPermissions() {
    return prisma.permission.findMany();
  }
  async getPermissionByName(name: string) {
    return prisma.permission.findUnique({ where: { name } });
  }
}

export const permissionService = new PermissionService();
