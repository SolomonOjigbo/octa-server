import prisma from "@shared/infra/database/prisma";
import { CreateCommunicationLogDto } from "../types/crm.dto";



export class CommunicationLogService {
  async createLog(dto: CreateCommunicationLogDto) {
    return prisma.communicationLog.create({ data: dto });
  }

  async getLogsForCustomer(customerId: string) {
    return prisma.communicationLog.findMany({ where: { customerId } });
  }

  async getLogsForSupplier(supplierId: string) {
    return prisma.communicationLog.findMany({ where: { supplierId } });
  }

  async getLogsForUser(userId: string) {
    return prisma.communicationLog.findMany({ where: { userId } });
  }

    async getLogById(id: string) {
    return prisma.communicationLog.findUnique({ where: { id } });
  }

}

export const communicationLogService = new CommunicationLogService();













// type CommunicationLog = Awaited<ReturnType<typeof prisma.communicationLog.create>>;

// export class CommunicationLogService {
//   async createLog(data: Partial<CommunicationLog>): Promise<CommunicationLog> {
//     return prisma.communicationLog.create({ data });
//   }

//   async getLogById(id: string): Promise<CommunicationLog | null> {
//     return prisma.communicationLog.findUnique({ where: { id } });
//   }

//   async listLogsForCustomer(customerId: string): Promise<CommunicationLog[]> {
//     return prisma.communicationLog.findMany({ where: { customerId } });
//   }

//   async listLogsForUser(userId: string): Promise<CommunicationLog[]> {
//     return prisma.communicationLog.findMany({ where: { userId } });
//   }
// }
