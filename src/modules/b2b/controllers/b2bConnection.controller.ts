import { Request, Response } from "express";
import { b2bConnectionService } from "../services/b2bConnection.service";
import { 
  createB2BConnectionSchema, 
  updateB2BConnectionSchema,
  approveB2BConnectionSchema,
  rejectB2BConnectionSchema,
  revokeB2BConnectionSchema,
  listB2BConnectionsSchema,
  checkConnectionStatusSchema
} from "../validations";
import { 
  CreateB2BConnectionDto, 
  UpdateB2BConnectionDto,
} from "../types/b2bConnection.dto";
import { auditService } from "@modules/audit/services/audit.service";
import { AuditAction, B2BAuditAction } from "@modules/audit/types/audit.dto";
import { AppError, ErrorCode } from "@common/constants/app.errors";
import { HttpStatusCode } from "@common/constants/http";
import { eventEmitter } from "@events/event.emitter";
import { B2BConnectionEvent } from "@events/types/b2bEvents.dto";

export class B2BConnectionController {
  
  async createConnection(req: Request, res: Response) {
    try {
      const validated = createB2BConnectionSchema.parse({
        ...req.body,
        tenantAId: req.user?.tenantId // Initiating tenant
      }) as CreateB2BConnectionDto;

      const connection = await b2bConnectionService.createConnection(
        validated,
        req.user?.id
      );

      await auditService.log({
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
        action: AuditAction.B2B_CONNECTION_CREATED,
        entityType: "B2BConnection",
        entityId: connection.id,
        metadata: {
          targetTenantId: validated.tenantBId,
          status: validated.status,
          type: validated.type
        }
      });

      eventEmitter.emit(B2BConnectionEvent.CONNECTION_REQUESTED, {
        connectionId: connection.id,
        initiatingTenantId: validated.tenantAId,
        targetTenantId: validated.tenantBId,
        requestedBy: req.user?.id
      });

      res.status(HttpStatusCode.CREATED).json(connection);
    } catch (err) {
      throw new AppError(
        err.message || 'Failed to create B2B connection',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }
  }

    async getConnectionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const connection = await b2bConnectionService.getConnectionById(
        id,
        req.user?.tenantId
      );

      if (!connection) {
        throw new AppError(
          'B2B connection not found',
          HttpStatusCode.NOT_FOUND,
         ErrorCode.B2B_CONNECTION_NOT_FOUND
        );
      }

      res.json(connection);
    } catch (err) {
      throw new AppError(
        err.message || 'Failed to fetch B2B connection',
        err.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR,
        err.code || 'SERVER_ERROR'
      );
    }
  }

  async updateConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = updateB2BConnectionSchema.parse({ 
        ...req.body, 
        id 
      }) as UpdateB2BConnectionDto;

      const connection = await b2bConnectionService.updateConnection(
        validated,
        req.user?.id
      );

      await auditService.log({
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
        action: AuditAction.B2B_CONNECTION_UPDATED,
        entityType: "B2BConnection",
        entityId: id,
        metadata: {
          changes: req.body
        }
      });

      eventEmitter.emit(B2BConnectionEvent.CONNECTION_UPDATED, {
        connectionId: id,
        updatedBy: req.user?.id,
        changes: req.body
      });

      res.json(connection);
    } catch (err) {
      throw new AppError(
        err.message || 'Failed to update B2B connection',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }
  }

  async deleteConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await b2bConnectionService.deleteConnection(
        id,
        req.user?.tenantId,
        req.user?.id
      );

      await auditService.log({
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
        action: B2BAuditAction.CONNECTION_DELETED,
        entityType: "B2BConnection",
        entityId: id
      });

      eventEmitter.emit(B2BConnectionEvent.CONNECTION_DELETED, {
        connectionId: id,
        deletedBy: req.user?.id
      });

      res.status(HttpStatusCode.NO_CONTENT).send();
    } catch (err) {
      throw new AppError(
        err.message || 'Failed to delete B2B connection',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }
  }

  
  async listConnectionsForTenant(req: Request, res: Response) {
    try {
      const filters = listB2BConnectionsSchema.parse({
        ...req.query,
        tenantId: req.user?.tenantId,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20
      });

      const connections = await b2bConnectionService.listConnectionsForTenant(
        filters.tenantId,
        filters.status,
        filters.type,
        filters.page,
        filters.limit
      );

      res.json(connections);
    } catch (err) {
      throw new AppError(
        err.message || 'Failed to fetch B2B connections',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_ERROR
      );
    }
  }

  
  async approveConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = approveB2BConnectionSchema.parse({
        ...req.body,
        approvedBy: req.user?.id
      });

      const connection = await b2bConnectionService.approveConnection(
        id,
        req.user?.tenantId,
        req.user?.id
      );

      await auditService.log({
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
        action: AuditAction.B2B_CONNECTION_APPROVED,
        entityType: "B2BConnection",
        entityId: id
      });

      eventEmitter.emit(B2BConnectionEvent.CONNECTION_APPROVED, {
        connectionId: id,
        approvedBy: req.user?.id,
        approvedByTenantId: req.user?.tenantId
      });

      res.json(connection);
    } catch (err) {
      throw new AppError(
        err.message || 'Failed to approve B2B connection',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }
  }

  
  async rejectConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = rejectB2BConnectionSchema.parse({
        ...req.body,
        rejectedBy: req.user?.id
      });

      const connection = await b2bConnectionService.rejectConnection(
        id,
        req.user?.tenantId,
        req.user?.id,
        validated.notes
      );

      await auditService.log({
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
        action: AuditAction.B2B_CONNECTION_REJECTED,
        entityType: "B2BConnection",
        entityId: id,
        metadata: {
          reason: validated.notes
        }
      });

      eventEmitter.emit(B2BConnectionEvent.CONNECTION_REJECTED, {
        connectionId: id,
        rejectedBy: req.user?.id,
        rejectedByTenantId: req.user?.tenantId,
        reason: validated.notes
      });

      res.json(connection);
    } catch (err) {
      throw new AppError(
        err.message || 'Failed to reject B2B connection',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }
  }

    async revokeConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = revokeB2BConnectionSchema.parse({
        ...req.body,
        revokedBy: req.user?.id
      });

      const connection = await b2bConnectionService.revokeConnection(
        id,
        req.user?.tenantId,
        req.user?.id,
        validated.notes
      );

      await auditService.log({
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
        action: B2BAuditAction.CONNECTION_REVOKED,
        entityType: "B2BConnection",
        entityId: id,
        metadata: {
          reason: validated.notes
        }
      });

      eventEmitter.emit(B2BConnectionEvent.CONNECTION_REVOKED, {
        connectionId: id,
        revokedBy: req.user?.id,
        revokedByTenantId: req.user?.tenantId,
        reason: validated.notes
      });

      res.json(connection);
    } catch (err) {
      throw new AppError(
        err.message || 'Failed to revoke B2B connection',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.INTERNAL_ERROR
      );
    }
  }

  
  async getConnectionHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const history = await b2bConnectionService.getConnectionHistory(
        id,
        req.user?.tenantId
      );

      res.json(history);
    } catch (err) {
      throw new AppError(
        err.message || 'Failed to fetch connection history',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_ERROR
      );
    }
  }

  async checkConnectionStatus(req: Request, res: Response) {
    try {
      const { partnerTenantId } = checkConnectionStatusSchema.parse(req.query);
      const result = await b2bConnectionService.getConnectionStatus(req.user.tenantId, partnerTenantId);
      res.status(200).json(result);
    } catch (err) {
        if (err instanceof AppError) {
            return res.status(err.statusCode).json({ message: err.message, code: err.code });
        }
        res.status(400).json({ message: "Request failed", details: err.errors || err.message });
    }
  }
}

export const b2bConnectionController = new B2BConnectionController();