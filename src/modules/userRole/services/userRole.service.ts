import { PrismaClient } from "@prisma/client";
import { AssignRoleDto, RemoveRoleDto } from "../types/userRole.dto";

const prisma = new PrismaClient();

export class UserRoleService {
  async assignRole(dto: AssignRoleDto) {
    // Validate user
    const user = await prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new Error("User not found.");

    // Validate role
    const role = await prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role || role.tenantId !== user.tenantId) {
      throw new Error("Role not found in this tenant.");
    }

    // Prevent duplicates
    const existing = await prisma.userRole.findUnique({
      where: { userId_roleId: { userId: dto.userId, roleId: dto.roleId } },
    });
    if (existing) throw new Error("Role already assigned to user.");

    return prisma.userRole.create({
      data: {
        userId: dto.userId,
        roleId: dto.roleId,
        assignedBy: dto.assignedBy,
      },
    });
  }

  async removeRole(dto: RemoveRoleDto) {
    // Ensure assignment exists
    const assignment = await prisma.userRole.findUnique({
      where: { userId_roleId: { userId: dto.userId, roleId: dto.roleId } },
    });
    if (!assignment) throw new Error("Role assignment not found.");

    return prisma.userRole.delete({
      where: { userId_roleId: { userId: dto.userId, roleId: dto.roleId } },
    });
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
}

export const userRoleService = new UserRoleService();
