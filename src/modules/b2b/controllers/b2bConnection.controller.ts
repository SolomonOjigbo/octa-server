import { Request, Response } from "express";
import { b2bConnectionService } from "../services/b2bConnection.service";
import { 
  createB2BConnectionSchema, 
  updateB2BConnectionSchema 
} from "../validations";
import { 
  CreateB2BConnectionDto, 
  UpdateB2BConnectionDto,
  B2BConnectionStatus
} from "../types/b2bConnection.dto";
import { auditService } from "../../audit/services/audit.service";
import { AuditAction } from "../../audit/types/audit.dto";

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
          status: validated.status
        }
      });

      res.status(201).json(connection);
    } catch (err) {
      res.status(400).json({ 
        code: "VALIDATION_ERROR",
        message: err.message 
      });
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
        return res.status(404).json({ 
          code: "NOT_FOUND",
          message: "B2B connection not found" 
        });
      }

      res.json(connection);
    } catch (err) {
      res.status(500).json({ 
        code: "SERVER_ERROR",
        message: "Failed to fetch B2B connection" 
      });
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

      res.json(connection);
    } catch (err) {
      res.status(400).json({ 
        code: "VALIDATION_ERROR",
        message: err.message 
      });
    }
  }

  async deleteConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await b2bConnectionService.deleteConnection(
        id,
        req.user?.tenantId
      );

      await auditService.log({
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
        action: AuditAction.B2B_CONNECTION_DELETED,
        entityType: "B2BConnection",
        entityId: id
      });

      res.status(204).send();
    } catch (err) {
      res.status(400).json({ 
        code: "DELETE_FAILED",
        message: err.message 
      });
    }
  }

  async listConnectionsForTenant(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const connections = await b2bConnectionService.listConnectionsForTenant(
        req.user?.tenantId || '',
        status as B2BConnectionStatus
      );

      res.json(connections);
    } catch (err) {
      res.status(500).json({ 
        code: "SERVER_ERROR",
        message: "Failed to fetch B2B connections" 
      });
    }
  }

  async approveConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const connection = await b2bConnectionService.approveConnection(
        id,
        req.user?.tenantId || '',
        req.user?.id
      );

      await auditService.log({
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
        action: AuditAction.B2B_CONNECTION_APPROVED,
        entityType: "B2BConnection",
        entityId: id
      });

      res.json(connection);
    } catch (err) {
      res.status(400).json({ 
        code: "APPROVAL_FAILED",
        message: err.message 
      });
    }
  }
}

export const b2bConnectionController = new B2BConnectionController();