import { Request, Response } from "express";
import { roleService } from "../services/role.service";
import { createRoleSchema, updateRoleSchema } from "../validations";
import { CreateRoleDto } from "../types/role.dto";

export class RoleController {
  async createRole(req: Request, res: Response) {
    try {
      const dto = createRoleSchema.parse(req.body) as CreateRoleDto;
      const role = await roleService.createRole(dto);
      res.status(201).json(role);
    } catch (err: any) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async getRoles(req: Request, res: Response) {
    const context = {
      tenantId: req.query.tenantId as string | undefined,
      storeId: req.query.storeId as string | undefined,
      warehouseId: req.query.warehouseId as string | undefined,
    };
    const roles = await roleService.getRoles(context);
    res.json(roles);
  }

  async getRolesByName(req: Request, res: Response) {
    const name = req.query.name as string;
    const context = {
      tenantId: req.query.tenantId as string | undefined,
      storeId: req.query.storeId as string | undefined,
      warehouseId: req.query.warehouseId as string | undefined,
    };
    const roles = await roleService.getRoleByName(name, context);
    res.json(roles);
  }

  async getRoleById(req: Request, res: Response) {
    const { id } = req.params;
    const role = await roleService.getRoleById(id);
    if (!role) return res.status(404).json({ message: "Role not found" });
    res.json(role);
  }

  async updateRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dto = updateRoleSchema.parse(req.body);
      const role = await roleService.updateRole(id, dto);
      res.json(role);
    } catch (err: any) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async deleteRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await roleService.deleteRole(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}

export const roleController = new RoleController();
