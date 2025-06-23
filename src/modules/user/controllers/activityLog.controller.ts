import { Request, Response } from "express";
import { ActivityLogService } from "../services/activityLog.service";

const activityService = new ActivityLogService();

export const logActivity = async (req: Request, res: Response) => {
  try {
    const log = await activityService.logActivity(req.body);
    res.status(201).json(log);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getLogById = async (req: Request, res: Response) => {
  try {
    const log = await activityService.getLogById(req.params.id);
    if (!log) return res.status(404).json({ error: "Log not found" });
    res.json(log);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const listLogsForUser = async (req: Request, res: Response) => {
  try {
    const logs = await activityService.listLogsForUser(req.params.userId);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const listLogsForTenant = async (req: Request, res: Response) => {
  try {
    const logs = await activityService.listLogsForTenant(req.params.tenantId);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const listLogsForStore = async (req: Request, res: Response) => {
  try {
    const logs = await activityService.listLogsForStore(req.params.storeId);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
