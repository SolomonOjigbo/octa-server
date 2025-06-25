import { Request, Response } from "express";
import { communicationLogService } from "../services/communicationLog.service";
import { createCommunicationLogSchema } from "../validations";
import { CreateCommunicationLogDto } from "../types/crm.dto";

export class CommunicationLogController {
  async createLog(req: Request, res: Response) {
    try {
      const validated = createCommunicationLogSchema.parse(req.body) as CreateCommunicationLogDto;
      const log = await communicationLogService.createLog(validated);
      res.status(201).json(log);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }
  async getLogsForCustomer(req: Request, res: Response) {
    const { customerId } = req.params;
    const logs = await communicationLogService.getLogsForCustomer(customerId);
    res.json(logs);
  }
  async getLogsForSupplier(req: Request, res: Response) {
    const { supplierId } = req.params;
    const logs = await communicationLogService.getLogsForSupplier(supplierId);
    res.json(logs);
  }
  async getLogsForUser(req: Request, res: Response) {
    const { userId } = req.params;
    const logs = await communicationLogService.getLogsForUser(userId);
    res.json(logs);
  }
  async getLogById (req: Request, res: Response) {
    try {
      const logs = await communicationLogService.getLogById(req.params.id);
      if (!logs) return res.status(404).json({ error: "Log not found" });
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
export const communicationLogController = new CommunicationLogController();

