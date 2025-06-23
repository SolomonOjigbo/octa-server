import { PrismaClient} from "@prisma/client";
const prisma = new PrismaClient();

type UserRole = Awaited<ReturnType<typeof prisma.userRole.create>>;

export class UserRoleService {
  async assignRole(data: Partial<UserRole>): Promise<UserRole> {
    return prisma.userRole.create({ data });
  }

  async revokeRole(id: string): Promise<UserRole> {
    return prisma.userRole.delete({ where: { id } });
  }

  async listRolesForUser(userId: string): Promise<UserRole[]> {
    return prisma.userRole.findMany({ where: { userId } });
  }

  async listUsersForRole(roleId: string): Promise<UserRole[]> {
    return prisma.userRole.findMany({ where: { roleId } });
  }
}
