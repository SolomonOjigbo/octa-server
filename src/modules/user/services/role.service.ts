import { PrismaClient} from "@prisma/client";
const prisma = new PrismaClient();

type Role = Awaited<ReturnType<typeof prisma.role.create>>;

export class RoleService {
  async createRole(data: Partial<Role>): Promise<Role> {
    return prisma.role.create({ data });
  }

  async getRoleById(id: string): Promise<Role | null> {
    return prisma.role.findUnique({ where: { id } });
  }

  async updateRole(id: string, data: Partial<Role>): Promise<Role> {
    return prisma.role.update({ where: { id }, data });
  }

  async deleteRole(id: string): Promise<Role> {
    return prisma.role.delete({ where: { id } });
  }

  async listRolesByTenant(tenantId: string): Promise<Role[]> {
    return prisma.role.findMany({ where: { tenantId } });
  }

  async listGlobalRoles(): Promise<Role[]> {
    return prisma.role.findMany({ where: { tenantId: null } });
  }
}
