import { PrismaClient } from "@prisma/client";
import { 
  CreateB2BConnectionDto, 
  UpdateB2BConnectionDto,
  B2BConnectionResponseDto,
  B2BConnectionWithRelationsDto,
  B2BConnectionStatus,
  B2BConnectionType,
  ApproveB2BConnectionDto,
  RejectB2BConnectionDto,
  RevokeB2BConnectionDto,
  ListB2BConnectionsDto
} from "../types/b2bConnection.dto";
import { eventEmitter } from "@events/event.emitter";
import { B2BConnectionEvent } from "@events/types/b2bEvents.dto";
import { cacheService } from "@cache/cache.service";
import { AuditAction, B2BAuditAction } from "@modules/audit/types/audit.dto";
import { auditService } from "@modules/audit/services/audit.service";
import { AppError, ErrorCode } from "@common/constants/app.errors";
import { HttpStatusCode } from "@common/constants/http";
import { logger } from "@logging/logger";

const prisma = new PrismaClient();

export class B2BConnectionService {
  private readonly CACHE_TTL = 60 * 10; // 10 minutes

  async createConnection(
    dto: CreateB2BConnectionDto,
    createdBy?: string
  ): Promise<B2BConnectionResponseDto> {
    return prisma.$transaction(async (tx) => {
      // Prevent self-connection
      if (dto.tenantAId === dto.tenantBId) {
        throw new AppError(
          "Cannot create connection with yourself",
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.SELF_CONNECTION_NOT_ALLOWED
        );
      }

      // Verify both tenants exist
      const tenants = await tx.tenant.findMany({
        where: {
          id: { in: [dto.tenantAId, dto.tenantBId] },
          deletedAt: null
        },
        select: { id: true }
      });

      if (tenants.length !== 2) {
        throw new AppError(
          "One or both tenants not found",
          HttpStatusCode.NOT_FOUND,
          ErrorCode.TENANT_NOT_FOUND
        );
      }

      // Prevent duplicate connections
      const existingConnection = await tx.b2BConnection.findFirst({
        where: {
          OR: [
            { tenantAId: dto.tenantAId, tenantBId: dto.tenantBId },
            { tenantAId: dto.tenantBId, tenantBId: dto.tenantAId }
          ],
          status: { not: "rejected" }
        }
      });

      if (existingConnection) {
        throw new AppError(
          "B2B connection already exists between these tenants",
          HttpStatusCode.CONFLICT,
          ErrorCode.B2B_CONNECTION_EXISTS
        );
      }

      const connection = await tx.b2BConnection.create({
        data: {
          tenantAId: dto.tenantAId,
          tenantBId: dto.tenantBId,
          status: dto.status || "pending",
          type: dto.type || "general",
          settings: dto.settings,
          metadata: {
            createdBy,
            createdAt: new Date().toISOString()
          }
        },
        select: this.defaultSelectFields()
      });

      // Audit log
      await auditService.log({
        userId: createdBy,
        tenantId: dto.tenantAId,
        action: AuditAction.B2B_CONNECTION_CREATED,
        entityType: "B2BConnection",
        entityId: connection.id,
        metadata: {
          targetTenantId: dto.tenantBId,
          status: connection.status,
          type: connection.type
        }
      });

      // Clear cache
      await this.clearConnectionCache(dto.tenantAId, dto.tenantBId);

      return connection;
    });
  }

  async getConnectionById(
    id: string,
    requestingTenantId?: string
  ): Promise<B2BConnectionWithRelationsDto | null> {
    try {
      const cacheKey = `b2b-connection:${id}`;
      const cached = await cacheService.get<B2BConnectionWithRelationsDto>(cacheKey);
      if (cached) return cached;

      const where = requestingTenantId ? { 
        id,
        OR: [
          { tenantAId: requestingTenantId },
          { tenantBId: requestingTenantId }
        ]
      } : { id };

      const connection = await prisma.b2BConnection.findUnique({
        where,
        select: {
          ...this.defaultSelectFields(),
          purchaseOrders: {
            select: {
              id: true,
              status: true,
              orderDate: true,
              totalAmount: true
            },
            take: 5,
            orderBy: { orderDate: 'desc' }
          },
          stockTransfers: {
            select: {
              id: true,
              status: true,
              transferType: true,
              createdAt: true,
              quantity: true
            },
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (connection) {
        await cacheService.set(cacheKey, connection, this.CACHE_TTL);
      }

      return connection;
    } catch (error) {
      logger.error("Failed to fetch B2B connection", { error, id });
      throw new AppError(
        "Failed to fetch B2B connection",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_ERROR
      );
    }
  }

  async updateConnection(
    dto: UpdateB2BConnectionDto,
    updatedBy?: string
  ): Promise<B2BConnectionResponseDto> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.b2BConnection.findUnique({
        where: { id: dto.id },
        select: { tenantAId: true, tenantBId: true, status: true }
      });

      if (!existing) {
        throw new AppError(
          "Connection not found",
          HttpStatusCode.NOT_FOUND,
          ErrorCode.B2B_CONNECTION_NOT_FOUND
        );
      }

      // Prevent status changes via update - use specific methods
      if (dto.status && dto.status !== existing.status) {
        throw new AppError(
          "Use approve/reject/revoke endpoints to change status",
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.INVALID_STATUS_CHANGE
        );
      }

      const connection = await tx.b2BConnection.update({
        where: { id: dto.id },
        data: {
          type: dto.type,
          settings: dto.settings,
          metadata: {
            updatedBy,
            updatedAt: new Date().toISOString()
          }
        },
        select: this.defaultSelectFields()
      });

      // Audit log
      await auditService.log({
        userId: updatedBy,
        tenantId: existing.tenantAId,
        action: AuditAction.B2B_CONNECTION_UPDATED,
        entityType: "B2BConnection",
        entityId: dto.id,
        metadata: {
          changes: dto,
          targetTenantId: existing.tenantBId
        }
      });

      // Clear cache
      await this.clearConnectionCache(existing.tenantAId, existing.tenantBId);

      // Emit event
      eventEmitter.emit(B2BConnectionEvent.CONNECTION_UPDATED, {
        connectionId: dto.id,
        updatedBy,
        changes: dto
      });

      return connection;
    });
  }

  async deleteConnection(
    id: string,
    requestingTenantId?: string,
    deletedBy?: string
  ): Promise<void> {
    return prisma.$transaction(async (tx) => {
      const connection = await tx.b2BConnection.findUnique({
        where: { id },
        select: { tenantAId: true, tenantBId: true }
      });

      if (!connection) {
        throw new AppError(
          "Connection not found",
          HttpStatusCode.NOT_FOUND,
          ErrorCode.B2B_CONNECTION_NOT_FOUND
        );
      }

      if (requestingTenantId && 
          connection.tenantAId !== requestingTenantId && 
          connection.tenantBId !== requestingTenantId) {
        throw new AppError(
          "Not authorized to delete this connection",
          HttpStatusCode.FORBIDDEN,
          ErrorCode.UNAUTHORIZED
        );
      }

      await tx.b2BConnection.delete({ where: { id } });

      // Audit log
      await auditService.log({
        userId: deletedBy,
        tenantId: requestingTenantId,
        action: AuditAction.B2B_CONNECTION_DELETED,
        entityType: "B2BConnection",
        entityId: id,
        metadata: {
          deletedByTenant: requestingTenantId
        }
      });

      // Clear cache
      await this.clearConnectionCache(connection.tenantAId, connection.tenantBId);

      // Emit event
      eventEmitter.emit(B2BConnectionEvent.CONNECTION_DELETED, {
        connectionId: id,
        deletedBy,
        deletedByTenantId: requestingTenantId
      });
    });
  }

  async listConnectionsForTenant(
    tenantId: string,
    status?: B2BConnectionStatus,
    type?: B2BConnectionType,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: B2BConnectionResponseDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      const cacheKey = `b2b-connections:${tenantId}:${status}:${type}:${page}:${limit}`;
      const cached = await cacheService.get(cacheKey);
      if (
        cached &&
        typeof cached === "object" &&
        Array.isArray((cached as any).data) &&
        (cached as any).pagination
      ) {
        return cached as {
          data: B2BConnectionResponseDto[];
          pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
          };
        };
      }

      const where = {
        OR: [
          { tenantAId: tenantId },
          { tenantBId: tenantId }
        ],
        ...(status && { status }),
        ...(type && { type })
      };

      const [total, data] = await Promise.all([
        prisma.b2BConnection.count({ where }),
        prisma.b2BConnection.findMany({
          where,
          select: this.defaultSelectFields(),
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        })
      ]);

      const result = {
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };

      await cacheService.set(cacheKey, result, this.CACHE_TTL);
      return result;
    } catch (error) {
      logger.error("Failed to fetch B2B connections", { error, tenantId });
      throw new AppError(
        "Failed to fetch B2B connections",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_ERROR
      );
    }
  }

  async approveConnection(
    id: string,
    approvingTenantId: string,
    approvedBy?: string,
    notes?: string
  ): Promise<B2BConnectionResponseDto> {
    return prisma.$transaction(async (tx) => {
      const connection = await tx.b2BConnection.findUnique({
        where: { 
          id,
          OR: [
            { tenantAId: approvingTenantId },
            { tenantBId: approvingTenantId }
          ],
          status: 'pending'
        }
      });

      if (!connection) {
        throw new AppError(
          "Connection not found or not pending approval",
          HttpStatusCode.NOT_FOUND,
          ErrorCode.B2B_CONNECTION_NOT_FOUND
        );
      }

      const updated = await tx.b2BConnection.update({
        where: { id },
        data: {
          status: 'approved',
          metadata: {
            approvedBy,
            approvedAt: new Date().toISOString(),
            ...(notes && { approvalNotes: notes })
          }
        },
        select: this.defaultSelectFields()
      });

      // Audit log
      await auditService.log({
        userId: approvedBy,
        tenantId: approvingTenantId,
        action: AuditAction.B2B_CONNECTION_APPROVED,
        entityType: "B2BConnection",
        entityId: id,
        metadata: {
          notes
        }
      });

      // Clear cache
      await this.clearConnectionCache(connection.tenantAId, connection.tenantBId);

      // Emit event
      eventEmitter.emit(B2BConnectionEvent.CONNECTION_APPROVED, {
        connectionId: id,
        approvedBy,
        approvedByTenantId: approvingTenantId,
        initiatingTenantId: connection.tenantAId,
        targetTenantId: connection.tenantBId,
        notes
      });

      return updated;
    });
  }

  async rejectConnection(
    id: string,
    rejectingTenantId: string,
    rejectedBy?: string,
    reason?: string
  ): Promise<B2BConnectionResponseDto> {
    return prisma.$transaction(async (tx) => {
      const connection = await tx.b2BConnection.findUnique({
        where: { 
          id,
          OR: [
            { tenantAId: rejectingTenantId },
            { tenantBId: rejectingTenantId }
          ],
          status: 'pending'
        }
      });

      if (!connection) {
        throw new AppError(
          "Connection not found or not pending approval",
          HttpStatusCode.NOT_FOUND,
          ErrorCode.B2B_CONNECTION_NOT_FOUND
        );
      }

      const updated = await tx.b2BConnection.update({
        where: { id },
        data: {
          status: 'rejected',
          metadata: {
            rejectedBy,
            rejectedAt: new Date().toISOString(),
            rejectionReason: reason
          }
        },
        select: this.defaultSelectFields()
      });

      // Audit log
      await auditService.log({
        userId: rejectedBy,
        tenantId: rejectingTenantId,
        action: AuditAction.B2B_CONNECTION_REJECTED,
        entityType: "B2BConnection",
        entityId: id,
        metadata: {
          reason
        }
      });

      // Clear cache
      await this.clearConnectionCache(connection.tenantAId, connection.tenantBId);

      // Emit event
      eventEmitter.emit(B2BConnectionEvent.CONNECTION_REJECTED, {
        connectionId: id,
        rejectedBy,
        rejectedByTenantId: rejectingTenantId,
        initiatingTenantId: connection.tenantAId,
        targetTenantId: connection.tenantBId,
        reason
      });

      return updated;
    });
  }

  async revokeConnection(
    id: string,
    revokingTenantId: string,
    revokedBy?: string,
    reason?: string
  ): Promise<B2BConnectionResponseDto> {
    return prisma.$transaction(async (tx) => {
      const connection = await tx.b2BConnection.findUnique({
        where: { 
          id,
          OR: [
            { tenantAId: revokingTenantId },
            { tenantBId: revokingTenantId }
          ],
          status: 'approved'
        }
      });

      if (!connection) {
        throw new AppError(
          "Connection not found or not approved",
          HttpStatusCode.NOT_FOUND,
          ErrorCode.B2B_CONNECTION_REVOKED
        );
      }

      const updated = await tx.b2BConnection.update({
        where: { id },
        data: {
          status: 'revoked',
          metadata: {
            revokedBy,
            revokedAt: new Date().toISOString(),
            revocationReason: reason
          }
        },
        select: this.defaultSelectFields()
      });

      // Audit log
      await auditService.log({
        userId: revokedBy,
        tenantId: revokingTenantId,
        action: B2BAuditAction.CONNECTION_REVOKED,
        entityType: "B2BConnection",
        entityId: id,
        metadata: {
          reason
        }
      });

      // Clear cache
      await this.clearConnectionCache(connection.tenantAId, connection.tenantBId);

      // Emit event
      eventEmitter.emit(B2BConnectionEvent.CONNECTION_REVOKED, {
        connectionId: id,
        revokedBy,
        revokedByTenantId: revokingTenantId,
        initiatingTenantId: connection.tenantAId,
        targetTenantId: connection.tenantBId,
        reason
      });

      return updated;
    });
  }

  async getConnectionHistory(
    id: string,
    tenantId?: string
  ): Promise<any[]> {
    try {
      const where = tenantId ? { 
        entityId: id,
        OR: [
          { tenantId },
          { metadata: { path: ['targetTenantId'], equals: tenantId } }
        ]
      } : { entityId: id };

      // Fetch audit logs/history for the connection
      const history = await auditService.getAll({
        entityType: "B2BConnection",
        entityId: id,
        tenantId
      });

      // Optionally log the fetch action
      await auditService.log({
        entityType: "B2BConnection",
        entityId: id,
        tenantId,
        action: B2BAuditAction.CONNECTION_HISTORY_FETCHED
      });

      return (history && Array.isArray(history.data)) ? history.data : [];
    } catch (error) {
      logger.error("Failed to fetch connection history", { error, id });
      throw new AppError(
        "Failed to fetch connection history",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_ERROR
      );
    }
  }

  private async clearConnectionCache(tenantAId: string, tenantBId: string): Promise<void> {
    try {
      await Promise.all([
        cacheService.del(`b2b-connections:${tenantAId}`),
        cacheService.del(`b2b-connections:${tenantBId}`),
        cacheService.del(`b2b-connection:*`) // Clear individual connection caches
      ]);
    } catch (error) {
      logger.error("Failed to clear B2B connection cache", { error });
    }
  }

  private defaultSelectFields() {
    return {
      id: true,
      tenantAId: true,
      tenantBId: true,
      status: true,
      type: true,
      settings: true,
      createdAt: true,
      updatedAt: true,
      tenantA: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true
        }
      },
      tenantB: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true
        }
      }
    };
  }
}

export const b2bConnectionService = new B2BConnectionService();