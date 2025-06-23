import { Request, Response } from "express";
import { UserRoleService } from "../services/userRole.service";

const userRoleService = new UserRoleService();

export const assignRole = async (req: Request, res: Response) => {
  try {
    const assignment = await userRoleService.assignRole(req.body);
    res.status(201).json(assignment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const revokeRole = async (req: Request, res: Response) => {
  try {
    await userRoleService.revokeRole(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const listRolesForUser = async (req: Request, res: Response) => {
  try {
    const roles = await userRoleService.listRolesForUser(req.params.userId);
    res.json(roles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const listUsersForRole = async (req: Request, res: Response) => {
  try {
    const users = await userRoleService.listUsersForRole(req.params.roleId);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
