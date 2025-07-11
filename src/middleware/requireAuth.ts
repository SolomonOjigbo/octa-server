import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ForbiddenError, UnauthorizedError } from "./errors";
import { auditService } from "../modules/audit/services/audit.service";
import { AuditAction } from "../modules/audit/types/audit.dto";
import { PrismaClient } from "@prisma/client";
import { defaultPermissions, permissions } from "@prisma/permissionsAndRoles";

const prisma = new PrismaClient();

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      tenantId: string;
      isActive: boolean;
      isSuperAdmin?: boolean;
      isAdmin: any;
      storeId?: string;
      roles: string[];
      permissions: string[];
      warehouseId?: string;
    };
  }
}

// export interface AuthenticatedRequest extends Request {
//   user?: {
//     id: string;
//     tenantId: string;
//     storeId?: string;
//     roles: string[];
//     permissions: string[];
//     isActive: boolean;        // user account enabled/disabled
//     isSuperAdmin: boolean;    // system-wide root
//     isAdmin: boolean;         // tenant-scoped admin
//   };
// }

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next(new UnauthorizedError("Missing Authorization header"));
  }

   if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // const token = authHeader.replace("Bearer ", "");
  
const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    //  {
    //   userId: string;
    //   tenantId: string;
    //   storeId?: string;
    //   isSuperAdmin?: boolean;
    //   isAdmin: boolean;
    //   roles: string[];
    //   permissions: string[];
    // };

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        tenantId: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      await auditService.log({
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        action: AuditAction.PERMISSION_DENIED,
        module: "User",
        entityId: decoded.userId,
        metadata: {
          ip: req.ip,
          userAgent: req.headers['user-agent'] || ''

        }
      });
      
      return next(new ForbiddenError("Account inactive or not found"));
    }

    // Attach user to request
    req.user = {
      id: user.id,
      tenantId: user.tenantId,
      storeId: user.storeId || undefined,
      isActive: user.isActive,
      isAdmin: user.isAdmin, // Assuming isAdmin is determined by isActive for simplicity
      roles: user.roles, // Default role, can be extended based on your logic
      isSuperAdmin: user.isSuperAdmin,
      permissions: user.permissions || defaultPermissions, // Default permissions, can be extended based on your logic
      warehouseId: user.warehouseId // Default warehouse, can be extended based on your logic
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError("Token expired"));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new UnauthorizedError("Invalid token"));
    }
    return next(err);
  }
}