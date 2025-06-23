import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type Permission = Awaited<ReturnType<typeof prisma.permission.create>>;

export class PermissionService {
  async createPermission(data: Partial<Permission>): Promise<Permission> {
    return prisma.permission.create({ data });
  }

  async getPermissionById(id: string): Promise<Permission | null> {
    return prisma.permission.findUnique({ where: { id } });
  }

  async updatePermission(id: string, data: Partial<Permission>): Promise<Permission> {
    return prisma.permission.update({ where: { id }, data });
  }

  async deletePermission(id: string): Promise<Permission> {
    return prisma.permission.delete({ where: { id } });
  }

  async listAllPermissions(): Promise<Permission[]> {
    return prisma.permission.findMany();
  }
}
