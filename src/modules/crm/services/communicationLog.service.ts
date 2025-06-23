import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();


type CommunicationLog = Awaited<ReturnType<typeof prisma.communicationLog.create>>;

export class CommunicationLogService {
  async createLog(data: Partial<CommunicationLog>): Promise<CommunicationLog> {
    return prisma.communicationLog.create({ data });
  }

  async getLogById(id: string): Promise<CommunicationLog | null> {
    return prisma.communicationLog.findUnique({ where: { id } });
  }

  async listLogsForCustomer(customerId: string): Promise<CommunicationLog[]> {
    return prisma.communicationLog.findMany({ where: { customerId } });
  }

  async listLogsForUser(userId: string): Promise<CommunicationLog[]> {
    return prisma.communicationLog.findMany({ where: { userId } });
  }
}
