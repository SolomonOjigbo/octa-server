// src/modules/audit/services/audit.service.ts
import prisma from "@shared/infra/database/prisma";
import { AuditEntry } from "../types/audit.dto";



export class AuditService {
  async log(entry: AuditEntry) {
    return prisma.activityLog.create({
      data: {
        tenantId: entry.tenantId,
        userId: entry.userId,
        action: `${entry.module}:${entry.action}`,
        details: entry.details,
        timestamp: entry.timestamp ?? new Date(),
      }
    });
  }

  async getLogs(tenantId: string, module?: string) {
    return prisma.activityLog.findMany({
      where: {
        tenantId,
        ...(module ? { action: { startsWith: `${module}:` } } : {}),
      },
      orderBy: { timestamp: "desc" },
    });
  }
}

export const auditService = new AuditService();
