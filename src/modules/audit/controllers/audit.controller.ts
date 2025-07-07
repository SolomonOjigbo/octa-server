import { Request, Response } from "express";
import { auditService } from "../services/audit.service";

export class AuditController {
  async getLogs(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const module = req.query.module as string | undefined;
    const logs = await auditService.getLogs(tenantId, module);
    res.json(logs);
  }

}

export const auditController = new AuditController();