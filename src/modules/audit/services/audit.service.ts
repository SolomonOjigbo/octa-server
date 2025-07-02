// src/modules/audit/audit.service.ts

import prisma from '@shared/infra/database/prisma';
import {
  AuditAction,
  AuditLogCreateParams,
  AuditLogQueryParams,
  BaseAuditLog,
  PaginatedAuditLogs,
} from '../types/audit.dto';
import { cacheService } from '@cache/cache.service';
import { AppError } from '@common/constants/app.errors';
import { eventEmitter } from '@events/event.emitter';
import { logger } from '@logging/logger';

export class AuditService {
  /**
   * Create and log an audit entry.
   */
  async log<T = unknown>(params: AuditLogCreateParams<T>): Promise<BaseAuditLog> {
    const {
      tenantId,
      userId,
      action,
      entityType,
      entityId,
      ipAddress,
      userAgent,
      metadata,
      // description,
    } = params;

    const auditLog = await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action,
        entityType,
        entityId,
        // description,
        ipAddress,
        userAgent,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });

    const cacheKey = `audit:${auditLog.id}`;
    await cacheService.set(cacheKey, auditLog, 3600); // 1 hour TTL

    eventEmitter.emit('audit:log', auditLog);
    return auditLog;
  }

  /**
   * Fetch a single audit entry by ID.
   */
  async getById(id: string): Promise<BaseAuditLog> {
    const cacheKey = `audit:${id}`;
    const cached = await cacheService.get<BaseAuditLog>(cacheKey);
    if (cached) return cached;

    const log = await prisma.auditLog.findUnique({ where: { id } });
    if (!log) throw new AppError('Audit log not found', 404);

    await cacheService.set(cacheKey, log, 3600);
    return log;
  }

  /**
   * Paginate and filter audit logs.
   */
  async getAll(params: AuditLogQueryParams): Promise<PaginatedAuditLogs> {
    const {
      tenantId,
      entityType,
      entityId,
      action,
      userId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = params;

    const where: any = {
      tenantId,
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...(action && { action }),
      ...(userId && { userId }),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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
   * Log a generic user activity.
   */
  async logUserActivity(params: {
    userId: string;
    tenantId: string;
    action: AuditAction;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    entityType?: string;
    entityId?: string;
  }) {
    return this.log({
      userId: params.userId,
      tenantId: params.tenantId,
      action: params.action,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      entityType: params.entityType,
      entityId: params.entityId,
    });
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