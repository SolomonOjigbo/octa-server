import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "./errors";



export function requirePermission(permission: string) {
  const requiresWarehouseContext = [
    'warehouse:create',
    'warehouse:update',
    'warehouse:view', 
    'warehouse:operations',
    'inventory:adjust',  // Add inventory operations
    'stock:adjust',
  ];

  return (req: Request, _res: Response, next: NextFunction) => {
    // Check user existence and permission
    if (!req.user?.permissions?.includes(permission)) {
      throw new ForbiddenError(`Missing permission: ${permission}`);
    }

    // Check warehouse context requirement (corrected condition)
    if (
      requiresWarehouseContext.includes(permission) && 
      !req.user.warehouseId
    ) {
      throw new ForbiddenError("Warehouse context required");
    }

    next();
  };
}