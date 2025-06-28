import { PrismaClient } from "@prisma/client";
import { 
  AuditLogCreateParams, 
  AuditLogQueryParams,
  PaginatedAuditLogs,
  UserActivityParams
} from "../types/audit.dto";
import { logger } from "../../../logging/logger";
import { AuditAction } from "../types/audit.dto";

const prisma = new PrismaClient();

export class AuditService {
  /**
   * General audit log creation method
   */
  async log(params: AuditLogCreateParams) {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          tenantId: params.tenantId,
          userId: params.userId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          details: params.details || {},
          metadata: {
            createdBy: params.userId,
            updatedBy: params.userId,
              ip: params.details?.ipAddress || 'unknown',
        userAgent: params.details?.userAgent || 'unknown',
          }
        },
      });

      logger.info(`Audit log created`, {
        auditLogId: auditLog.id,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
      });

      return auditLog;
    } catch (error) {
      logger.error(`Failed to create audit log`, {
        error,
        params,
      });
      throw error;
    }
  }

  /**
   * Specialized method for user activity logging
   */
  async logUserActivity(params: UserActivityParams) {
    try {
      const auditLog = await this.log({
        tenantId: params.tenantId,
        userId: params.userId,
        action: params.action,
        entityType: 'UserActivity',
        entityId: params.entityId || 'system',
        details: {
          ...params.metadata,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent
        }
      });

      return auditLog;
    } catch (error) {
      logger.error(`Failed to log user activity`, {
        error,
        params,
      });
      throw error;
    }
  }

  /**
   * Query audit logs with pagination
   */
  async getAuditLogs(params: AuditLogQueryParams): Promise<PaginatedAuditLogs> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = { tenantId: params.tenantId };

      if (params.entityType) where.entityType = params.entityType;
      if (params.entityId) where.entityId = params.entityId;
      if (params.action) where.action = params.action;
      if (params.userId) where.userId = params.userId;

      if (params.dateFrom || params.dateTo) {
        where.createdAt = {};
        if (params.dateFrom) where.createdAt.gte = params.dateFrom;
        if (params.dateTo) where.createdAt.lte = params.dateTo;
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      return {
        data: logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Failed to fetch audit logs`, {
        error,
        params,
      });
      throw error;
    }
  }

  /**
   * Get single audit log by ID
   */
  async getAuditLogById(id: string): Promise<any> {
    try {
      const log = await prisma.auditLog.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!log) {
        throw new Error(`Audit log with ID ${id} not found`);
      }

      return log;
    } catch (error) {
      logger.error(`Failed to fetch audit log by ID`, { error, id });
      throw error;
    }
  }

  /**
   * Purge logs older than specified days
   */
  async purgeOldLogs(olderThanDays: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await prisma.auditLog.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });

      logger.info(`Purged ${result.count} audit logs older than ${olderThanDays} days`);
      return result.count;
    } catch (error) {
      logger.error(`Failed to purge old audit logs`, { error });
      throw error;
    }
  }

  /**
   * Convenience methods for common audit actions
   */
  async logLogin(userId: string, tenantId: string, metadata?: any) {
    return this.logUserActivity({
      userId,
      tenantId,
      action: AuditAction.USER_LOGIN,
      metadata
    });
  }

  async logLogout(userId: string, tenantId: string, metadata?: any) {
    return this.logUserActivity({
      userId,
      tenantId,
      action: AuditAction.USER_LOGOUT,
      metadata
    });
  }

  async logPermissionDenied(userId: string, tenantId: string, metadata?: any) {
    return this.logUserActivity({
      userId,
      tenantId,
      action: AuditAction.PERMISSION_DENIED,
      metadata
    });
  }
}

export const auditService = new AuditService();