import { Request, Response } from "express";
import { auditService } from "../services/audit.service";
import { 
  AuditLogQueryParams,
  AuditAction
} from "../types/audit.dto";
import { validateAuditQuery } from "../validations";
import { logger } from "../../../logging/logger";

export class AuditController {
  async getAuditLogs(req: Request, res: Response) {
    try {
      const validated = validateAuditQuery(req.query);
      
      const logs = await auditService.getAuditLogs({
        tenantId: req.user?.tenantId || validated.tenantId,
        entityType: validated.entityType,
        entityId: validated.entityId,
        action: validated.action,
        userId: validated.userId,
        dateFrom: validated.dateFrom ? new Date(validated.dateFrom) : undefined,
        dateTo: validated.dateTo ? new Date(validated.dateTo) : undefined,
        page: validated.page,
        limit: validated.limit,
      });

      res.json(logs);
    } catch (error) {
      logger.error("Failed to fetch audit logs", { error });
      res.status(500).json({ 
        error: "ServerError",
        message: "Failed to fetch audit logs" 
      });
    }
  }

  async purgeAuditLogs(req: Request, res: Response) {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ 
          error: "Forbidden",
          message: "Admin access required" 
        });
      }

      const days = parseInt(req.query.days as string) || 365;
      const count = await auditService.purgeOldLogs(days);
      
      res.json({ 
        success: true,
        purgedCount: count 
      });
    } catch (error) {
      logger.error("Failed to purge audit logs", { error });
      res.status(500).json({ 
        error: "ServerError",
        message: "Failed to purge audit logs" 
      });
    }
  }
}

export const auditController = new AuditController();