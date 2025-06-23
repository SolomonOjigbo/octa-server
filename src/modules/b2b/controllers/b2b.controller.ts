import { Request, Response } from "express";
import { B2BConnectionService } from "../services/b2bConnection.service";

const b2bService = new B2BConnectionService();

export const createConnection = async (req: Request, res: Response) => {
  try {
    const connection = await b2bService.createConnection(req.body);
    res.status(201).json(connection);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getConnectionById = async (req: Request, res: Response) => {
  try {
    const connection = await b2bService.getConnectionById(req.params.id);
    if (!connection) return res.status(404).json({ error: "Connection not found" });
    res.json(connection);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateConnection = async (req: Request, res: Response) => {
  try {
    const connection = await b2bService.updateConnection(req.params.id, req.body);
    res.json(connection);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteConnection = async (req: Request, res: Response) => {
  try {
    await b2bService.deleteConnection(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const listConnectionsForTenant = async (req: Request, res: Response) => {
  try {
    const connections = await b2bService.listConnectionsForTenant(req.params.tenantId);
    res.json(connections);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
