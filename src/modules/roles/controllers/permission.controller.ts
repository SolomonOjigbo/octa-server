import { Request, Response } from "express";
import { permissionService } from "../services/permission.service";
// const permissionService = new PermissionService();

export class PermissionController {
  async createPermission(req: Request, res: Response) {
    const { name, description } = req.body;
    const permission = await permissionService.createPermission(name, description);
    res.status(201).json(permission);
  }
  async getPermissions(req: Request, res: Response) {
    const permissions = await permissionService.getPermissions();
    res.json(permissions);
  }

  async updatePermission (req: Request, res: Response) {
    try {
      const permission = await permissionService.updatePermission(req.params.id, req.body);
      res.json(permission);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
  
  async getPermissionById (req: Request, res: Response) {
  try {
    const permission = await permissionService.getPermissionById(req.params.id);
    if (!permission) return res.status(404).json({ error: "Permission not found" });
    res.json(permission);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
   async deletePermission (req: Request, res: Response)  {
    try {
      await permissionService.deletePermission(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
export const permissionController = new PermissionController();









export const listAllPermissions = async (_req: Request, res: Response) => {
  try {
    const permissions = await permissionService.listAllPermissions();
    res.json(permissions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

