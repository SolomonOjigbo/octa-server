import prisma from "@shared/infra/database/prisma";
import { AssignRoleDto, RemoveRoleDto } from "../types/userRole.dto";



export class UserRoleService {
  async assignRole(tenantId: string, dto: AssignRoleDto) {
    // Validate user
    const user = await prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new Error("User not found.");

    // Validate role
    const role = await prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role || role.tenantId !== user.tenantId) {
      throw new Error("Role not found in this tenant.");
    }

    // Prevent duplicates
    // const existing = await prisma.userRole.findUnique({
    //   where: { userId: dto.userId, roleId: dto.roleId } ,
    // });
    // if (existing) throw new Error("Role already assigned to user.");

    return prisma.userRole.create({
      data: {
        user: {connect: {id: dto.userId}},
        role: {connect: {id: dto.roleId}},
        tenant: {connect: {id: tenantId}},
        assignedBy: dto.assignedBy,
      },
    });
  }

async removeRole(tenantId: string, dto: RemoveRoleDto) {
  try {
    return await prisma.userRole.delete({
      where: {
        userId_roleId_tenantId: {
          userId: dto.userId,
          roleId: dto.roleId,
          tenantId: tenantId
        }
      }
    });
  } catch (e) {
    if (e.code === 'P2025') {
      throw new Error("Role assignment not found");
    }
    throw e;
  }
}


  async getUserRoles(userId: string) {
    return prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
  }

  async getRoleUsers(roleId: string) {
    return prisma.userRole.findMany({
      where: { roleId },
      include: { user: true },
    });
  }

  /**
   * Get all user emails for a given role name within a tenant.
   */
  async getUserEmailsByRoleName(
    roleName: string,
    tenantId: string
  ): Promise<string[]> {
    // 1. Find the Role record
    const role = await prisma.role.findFirst({
      where: { name: roleName, tenantId },
      select: { id: true },
    });
    if (!role) return [];

    // 2. Find all UserRole assignments for that role
    const assignments = await prisma.userRole.findMany({
      where: { roleId: role.id },
      include: { user: { select: { email: true } } },
    });

    // 3. Extract and dedupe emails
    const emails = assignments
      .map(a => a.user.email)
      .filter((e): e is string => !!e);
    return Array.from(new Set(emails));
  }

  /**
   * Get all user emails for multiple role names within a tenant.
   */
  async getUserEmailsByRoleNames(
    roleNames: string[],
    tenantId: string
  ): Promise<string[]> {
    // 1. Find all matching Roles
    const roles = await prisma.role.findMany({
      where: { name: { in: roleNames }, tenantId },
      select: { id: true },
    });
    if (roles.length === 0) return [];

    const roleIds = roles.map(r => r.id);

    // 2. Fetch assignments
    const assignments = await prisma.userRole.findMany({
      where: { roleId: { in: roleIds } },
      include: { user: { select: { email: true } } },
    });

    // 3. Extract and dedupe
    const emails = assignments
      .map(a => a.user.email)
      .filter((e): e is string => !!e);
    return Array.from(new Set(emails));
  }

}

export const userRoleService = new UserRoleService();
