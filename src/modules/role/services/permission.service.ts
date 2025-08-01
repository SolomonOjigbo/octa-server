import { redisClient } from "@middleware/cache";
import prisma from "@shared/infra/database/prisma";
import { PERMISSIONS, ROLES } from "../../../prisma/permissionsAndRoles";



export class PermissionService {
  async createPermission(name: string, description?: string) {
      const existing = await prisma.permission.findUnique({ 
    where: { name } 
  });
  if (existing) throw new Error("Permission exists");
  
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
  async getUserPermissions(userId: string) {
    // In getUserPermissions:
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: true }
            }
          }
        }
      }
    });
const cacheKey = `user:${userId}:${user.warehouseId || 'no-wh'}:permissions`;
    const cached = await redisClient.get(cacheKey);
    
    if (cached) return JSON.parse(cached);


    const permissions = new Set<string>();
    user?.roles.forEach(userRole => {
      userRole.role.permissions.forEach(permission => {
        permissions.add(permission.name);
      });
    });

    // Add special admin permissions
    if (user?.roles.some(r => r.role.name === 'superAdmin')) {
      PERMISSIONS.forEach(p => permissions.add(p));
    } else if (user?.roles.some(r => r.role.name === 'globalAdmin')) {
      ROLES.globalAdmin.permissions.forEach(p => permissions.add(p));
    }

     if (user.warehouseId) {
    permissions.add('warehouse:operations');
    permissions.add('warehouse:view');
    permissions.add('warehouse:update');
  }

    const permArray = Array.from(permissions);
    await redisClient.set(cacheKey, JSON.stringify(permArray), { ttl: 300 }); // 5 min cache
    
    return permArray;
  }
}

export const permissionService = new PermissionService();
