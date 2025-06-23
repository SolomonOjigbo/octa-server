import { Request, Response } from "express";
import { PermissionService } from "../services/permission.service";

const permissionService = new PermissionService();

export const createPermission = async (req: Request, res: Response) => {
  try {
    const permission = await permissionService.createPermission(req.body);
    res.status(201).json(permission);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getPermissionById = async (req: Request, res: Response) => {
  try {
    const permission = await permissionService.getPermissionById(req.params.id);
    if (!permission) return res.status(404).json({ error: "Permission not found" });
    res.json(permission);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePermission = async (req: Request, res: Response) => {
  try {
    const permission = await permissionService.updatePermission(req.params.id, req.body);
    res.json(permission);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deletePermission = async (req: Request, res: Response) => {
  try {
    await permissionService.deletePermission(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const listAllPermissions = async (_req: Request, res: Response) => {
  try {
    const permissions = await permissionService.listAllPermissions();
    res.json(permissions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
