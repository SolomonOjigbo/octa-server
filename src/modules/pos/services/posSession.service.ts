import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type POSSession = Awaited<ReturnType<typeof prisma.pOSSession.create>>;

export class POSSessionService {
  async createSession(data: Partial<POSSession>): Promise<POSSession> {
    return prisma.pOSSession.create({ data });
  }

  async getSessionById(id: string): Promise<POSSession | null> {
    return prisma.pOSSession.findUnique({ where: { id } });
  }

  async updateSession(id: string, data: Partial<POSSession>): Promise<POSSession> {
    return prisma.pOSSession.update({ where: { id }, data });
  }

  async closeSession(id: string, closingBalance: number): Promise<POSSession> {
    return prisma.pOSSession.update({
      where: { id },
      data: { closingBalance, isOpen: false, closedAt: new Date() }
    });
  }

  async listSessionsByStore(storeId: string): Promise<POSSession[]> {
    return prisma.pOSSession.findMany({ where: { storeId } });
  }

  async listSessionsByUser(userId: string): Promise<POSSession[]> {
    return prisma.pOSSession.findMany({ where: { userId } });
  }
}
export async function getActivePOSSessionByStore(storeId: string): Promise<POSSession | null> {
  return prisma.pOSSession.findFirst({
    where: { storeId, isOpen: true },
    orderBy: { createdAt: 'desc' }
  });
}