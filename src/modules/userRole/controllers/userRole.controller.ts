import { Request, Response } from "express";
import { userRoleService } from "../services/userRole.service";
import { assignRoleSchema, removeRoleSchema } from "../validations";
import { AssignRoleDto, RemoveRoleDto } from "../types/userRole.dto";

export class UserRoleController {
  /**
   * @swagger
   * /user-roles:
   *   post:
   *     summary: Assign a role to a user
   *     tags: [UserRole]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AssignRole'
   *     responses:
   *       201:
   *         description: Role assigned
   *       400:
   *         description: Validation or assignment error
   *       403:
   *         description: Forbidden
   */
  async assignRole(req: Request, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const dto = assignRoleSchema.parse(req.body) as AssignRoleDto;
      const result = await userRoleService.assignRole(tenantId, dto);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  /**
   * @swagger
   * /user-roles:
   *   delete:
   *     summary: Remove a role from a user
   *     tags: [UserRole]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RemoveRole'
   *     responses:
   *       200:
   *         description: Role removed
   *       400:
   *         description: Validation or removal error
   *       403:
   *         description: Forbidden
   */
  async removeRole(req: Request, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const dto = removeRoleSchema.parse(req.body) as RemoveRoleDto;
      await userRoleService.removeRole(tenantId, dto);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  /**
   * @swagger
   * /users/{userId}/roles:
   *   get:
   *     summary: Get all roles assigned to a user
   *     tags: [UserRole]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         schema:
   *           type: string
   *         required: true
   *     responses:
   *       200:
   *         description: List of user-role assignments
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/UserRole'
   *       403:
   *         description: Forbidden
   */
  async getUserRoles(req: Request, res: Response) {
    const userId = req.params.userId;
    const roles = await userRoleService.getUserRoles(userId);
    res.json(roles);
  }

  /**
   * @swagger
   * /roles/{roleId}/users:
   *   get:
   *     summary: Get all users assigned to a role
   *     tags: [UserRole]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roleId
   *         schema:
   *           type: string
   *         required: true
   *     responses:
   *       200:
   *         description: List of role-user assignments
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/UserRole'
   *       403:
   *         description: Forbidden
   */
  async getRoleUsers(req: Request, res: Response) {
    const roleId = req.params.roleId;
    const users = await userRoleService.getRoleUsers(roleId);
    res.json(users);
  }
}

export const userRoleController = new UserRoleController();
