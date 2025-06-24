import { Request, Response } from "express";
import { auditService } from "../services/audit.service";

export class AuditController {
  async getAuditLogs(req: Request, res: Response) {
    const {
      tenantId,
      entityType,
      entityId,
      action,
      userId,
      dateFrom,
      dateTo,
    } = req.query;
    const logs = await auditService.getAuditLogs({
      tenantId: tenantId as string,
      entityType: entityType as string,
      entityId: entityId as string,
      action: action as string,
      userId: userId as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
    });
    res.json(logs);
  }
}

export const auditController = new AuditController();
