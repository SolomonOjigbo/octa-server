import { Request, Response } from "express";
import { userService } from "../services/user.service";
import { createUserSchema, updateUserSchema } from "../validations";
import { CreateUserDto, UpdateUserDto } from "../types/user.dto";
import { auditService } from "../../../modules/audit/services/audit.service";
import { AuditAction, UserActivity } from "../../../modules/audit/types/audit.dto";

export class UserController {
  async createUser(req: Request, res: Response) {
    try {
      const validated = createUserSchema.parse(req.body) as CreateUserDto;
      const user = await userService.createUser(validated);
      
      await auditService.logUserActivity({
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
        action: AuditAction.USER_CREATED,
        entityId: user.id,
        metadata: { email: user.email }
      });

      res.status(201).json(user);
    } catch (err) {
      res.status(400).json({ 
        error: "ValidationError",
        details: err.errors || err.message 
      });
    }
  }

  async getUsers(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { page = 1, limit = 20, search } = req.query;
      
      const users = await userService.getUsers({
        tenantId,
        page: Number(page),
        limit: Number(limit),
        search: typeof search === "string" ? search : undefined
      });
      
      res.json(users);
    } catch (err) {
      res.status(500).json({ 
        error: "ServerError",
        message: "Failed to fetch users" 
      });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      
      const user = await userService.getUserById(id, tenantId);
      if (!user) {
        return res.status(404).json({ 
          error: "NotFound",
          message: "User not found" 
        });
      }
      
      res.json(user);
    } catch (err) {
      res.status(500).json({ 
        error: "ServerError",
        message: "Failed to fetch user" 
      });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      const validated = updateUserSchema.parse(req.body) as UpdateUserDto;
      
      const user = await userService.updateUser(id, tenantId, validated);
      
      await auditService.logUserActivity({
        userId: req.user?.id,
        tenantId,
        action: AuditAction.USER_UPDATED,
        entityId: user.id,
        metadata: { fields: Object.keys(validated) }
      });

      res.json(user);
    } catch (err) {
      res.status(400).json({ 
        error: "ValidationError",
        details: err.errors || err.message 
      });
    }
  }

  async deactivateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      
      const user = await userService.deactivateUser(id, tenantId);
      
      await auditService.logUserActivity({
        userId: req.user?.id,
        tenantId,
        action: AuditAction.USER_DEACTIVATED,
        entityId: user.id
      });

      res.status(204).send();
    } catch (err) {
      res.status(400).json({ 
        error: "RequestError",
        message: err.message 
      });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      
      await userService.deleteUser(id, tenantId);
      
      await auditService.logUserActivity({
        userId: req.user?.id,
        tenantId,
        action: AuditAction.USER_DELETED,
        entityId: id
      });

      res.status(204).send();
    } catch (err) {
      res.status(400).json({ 
        error: "RequestError",
        message: err.message 
      });
    }
  }
}

export const userController = new UserController();