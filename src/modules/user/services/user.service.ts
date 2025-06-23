import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type User = Awaited<ReturnType<typeof prisma.user.create>>;

export class UserService {
  async createUser(data: Partial<User>): Promise<User> {
    return prisma.user.create({ data });
  }

  async getUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async deleteUser(id: string): Promise<User> {
    return prisma.user.delete({ where: { id } });
  }

  async listUsersByTenant(tenantId: string): Promise<User[]> {
    return prisma.user.findMany({ where: { tenantId } });
  }
}
