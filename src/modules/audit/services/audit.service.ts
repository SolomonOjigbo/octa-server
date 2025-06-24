import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class AuditService {
  async log({
    tenantId,
    userId,
    action,
    entityType,
    entityId,
    details,
  }: {
    tenantId: string;
    userId?: string;
    action: string;
    entityType: string;
    entityId: string;
    details?: any;
  }) {
    return prisma.auditLog.create({
      data: { tenantId, userId, action, entityType, entityId, details },
    });
  }

  async getAuditLogs({
    tenantId,
    entityType,
    entityId,
    action,
    userId,
    dateFrom,
    dateTo,
  }: {
    tenantId: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    userId?: string;
    dateFrom?: string | Date;
    dateTo?: string | Date;
  }) {
    const where: any = { tenantId };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    return prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" } });
  }
}

export const auditService = new AuditService();
