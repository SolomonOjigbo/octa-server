import { Request, Response } from "express";
import { roleService } from "../services/role.service";
import { 
  createRoleSchema, 
  assignRoleSchema, 
  updateRoleSchema 
} from "../validations";
import { 
  CreateRoleDto, 
  AssignRoleDto, 
  RoleResponseDto,
} from "../types/role.dto";
import { auditService } from "../../audit/services/audit.service";
import { UserActivity } from "../../audit/types/audit.dto";

export class RoleController {
  async createRole(req: Request, res: Response) {
    try {
      const validated = createRoleSchema.parse(req.body) as CreateRoleDto;
      const role = await roleService.createRole(validated);
      
      await auditService.logUserActivity({
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
        action: UserActivity.CREATE_ROLE,
        entityId: role.id,
        metadata: { 
          name: role.name,
          permissionCount: validated.permissionIds.length 
        }
      });

      res.status(201).json(this.toRoleResponseDto(role));
    } catch (err) {
      res.status(400).json({ 
        error: "ValidationError",
        details: err.errors || err.message 
      });
    }
  }

  async assignRole(req: Request, res: Response) {
    try {
      const validated = assignRoleSchema.parse(req.body) as AssignRoleDto;
      const userRole = await roleService.assignRole(validated);
      
      await auditService.logUserActivity({
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
        action: UserActivity.ASSIGN_ROLE,
        entityId: userRole.id,
        metadata: { 
          userId: validated.userId,
          roleId: validated.roleId 
        }
      });

      res.status(201).json(userRole);
    } catch (err) {
      res.status(400).json({ 
        error: "ValidationError",
        details: err.errors || err.message 
      });
    }
  }

  async getUserPermissions(req: Request, res: Response) {
    try {
      const { userId, tenantId, storeId, warehouseId } = req.query;
      const permissions = await roleService.getUserPermissions(
        userId as string,
        tenantId as string,
        storeId as string | undefined,
        warehouseId as string | undefined
      );
      
      res.json({ permissions });
    } catch (err) {
      res.status(500).json({ 
        error: "ServerError",
        message: "Failed to fetch permissions" 
      });
    }
  }

  async getRoleById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const role = await roleService.getRoleById(id);
      
      if (!role) {
        return res.status(404).json({ 
          error: "NotFound",
          message: "Role not found" 
        });
      }
      
      res.json(this.toRoleResponseDto(role));
    } catch (err) {
      res.status(500).json({ 
        error: "ServerError",
        message: "Failed to fetch role" 
      });
    }
  }

  private toRoleResponseDto(role: any): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      tenantId: role.tenantId,
      storeId: role.storeId,
      warehouseId: role.warehouseId,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions?.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description
      })) || []
    };
  }
}

export const roleController = new RoleController();