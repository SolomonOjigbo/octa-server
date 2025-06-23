import { Request, Response } from "express";
import { CommunicationLogService } from "../services/communicationLog.service";

const logService = new CommunicationLogService();

export const createLog = async (req: Request, res: Response) => {
  try {
    const log = await logService.createLog(req.body);
    res.status(201).json(log);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getLogById = async (req: Request, res: Response) => {
  try {
    const log = await logService.getLogById(req.params.id);
    if (!log) return res.status(404).json({ error: "Log not found" });
    res.json(log);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const listLogsForCustomer = async (req: Request, res: Response) => {
  try {
    const logs = await logService.listLogsForCustomer(req.params.customerId);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const listLogsForUser = async (req: Request, res: Response) => {
  try {
    const logs = await logService.listLogsForUser(req.params.userId);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
