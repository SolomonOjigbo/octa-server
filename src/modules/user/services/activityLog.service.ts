import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();


type ActivityLog = Awaited<ReturnType<typeof prisma.activityLog.create>>;

export class ActivityLogService {
  async logActivity(data: Partial<ActivityLog>): Promise<ActivityLog> {
    return prisma.activityLog.create({ data });
  }

  async getLogById(id: string): Promise<ActivityLog | null> {
    return prisma.activityLog.findUnique({ where: { id } });
  }

  async listLogsForUser(userId: string): Promise<ActivityLog[]> {
    return prisma.activityLog.findMany({ where: { userId } });
  }

  async listLogsForTenant(tenantId: string): Promise<ActivityLog[]> {
    return prisma.activityLog.findMany({ where: { tenantId } });
  }

  async listLogsForStore(storeId: string): Promise<ActivityLog[]> {
    return prisma.activityLog.findMany({ where: { storeId } });
  }
}
