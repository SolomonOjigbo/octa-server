import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type B2BConnection = Awaited<ReturnType<typeof prisma.b2BConnection.create>>;

export class B2BConnectionService {
  async createConnection(data: Partial<B2BConnection>): Promise<B2BConnection> {
    return prisma.b2BConnection.create({ data });
  }

  async getConnectionById(id: string): Promise<B2BConnection | null> {
    return prisma.b2BConnection.findUnique({ where: { id } });
  }

  async updateConnection(id: string, data: Partial<B2BConnection>): Promise<B2BConnection> {
    return prisma.b2BConnection.update({ where: { id }, data });
  }

  async deleteConnection(id: string): Promise<B2BConnection> {
    return prisma.b2BConnection.delete({ where: { id } });
  }

  async listConnectionsForTenant(tenantId: string): Promise<B2BConnection[]> {
    return prisma.b2BConnection.findMany({
      where: {
        OR: [
          { tenantAId: tenantId },
          { tenantBId: tenantId }
        ]
      }
    });
  }
}
