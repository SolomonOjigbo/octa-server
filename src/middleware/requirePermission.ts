import { roleService } from "../modules/roles/services/role.service";
import { Request, Response, NextFunction } from "express";

import { redisClient } from "../middleware/cache";
import { auditService } from "../modules/audit/services/audit.service";
import { UserActivity } from "../modules/audit/types/audit.dto";
import { ForbiddenError } from "./errors";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      isAdmin: any;
      roles: string[];
      isActive: boolean;
      isSuperAdmin?: boolean;
      id: string;
      tenantId: string;
      storeId?: string;
      warehouseId?: string;
    };
  }
}

export function requirePermission(permission: string) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ForbiddenError("Authentication required");
      }

      const { id: userId, tenantId, storeId, warehouseId } = req.user;

      // Cache key for user permissions
      const cacheKey = `user:${userId}:permissions:${tenantId}:${storeId || ''}:${warehouseId || ''}`;

      // Try to get permissions from cache
      let permissions: string[] = [];
      const cachedPermissions = await redisClient.get(cacheKey);
      
      if (cachedPermissions) {
        permissions = JSON.parse(cachedPermissions);
      } else {
        // Get from database if not in cache
        permissions = await roleService.getUserPermissions(
          userId, 
          tenantId, 
          storeId, 
          warehouseId
        );
        
        // Cache permissions for 5 minutes
        await redisClient.set(
          cacheKey, 
          JSON.stringify(permissions)
        );
      }

      // Check if user has required permission
      if (!permissions.includes(permission)) {
        await auditService.log({
          userId,
          tenantId,
          action: UserActivity.PERMISSION_DENIED,
          entityId: '',
          entityType: ""
        });

        throw new ForbiddenError(
          `Missing required permission: ${permission}`
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}