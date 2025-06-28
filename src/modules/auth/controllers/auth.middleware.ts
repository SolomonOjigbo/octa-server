// auth.middleware.ts
import { PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request interface to include user and tenant
declare global {
  namespace Express {
    interface Request {
      user?: any;
      tenant?: any;
    }
  }
}

const prisma = new PrismaClient();

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ 
      code: "MISSING_AUTH_HEADER",
      message: "Authorization header is required" 
    });
  }

  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    
    if (typeof decoded !== "object" || decoded === null || !("userId" in decoded)) {
      return res.status(401).json({ 
        code: "INVALID_TOKEN",
        message: "Invalid token format" 
      });
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        tenant: true,
        roles: {
          include: {
            role: {
              include: { permissions: true }
            }
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        code: "USER_INACTIVE",
        message: "User account is inactive" 
      });
    }

    // Attach user and tenant to request
    req.user = user;
    req.tenant = user.tenant;
    
    next();
  } catch (e) {
    return res.status(401).json({ 
      code: "INVALID_TOKEN",
      message: "Invalid or expired token" 
    });
  }
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        code: "UNAUTHORIZED",
        message: "Authentication required" 
      });
    }

    const hasPermission = req.user.roles.some((userRole: any) =>
      userRole.permissions
        ? userRole.permissions.some((p: any) => p.name === permission)
        : userRole.role && userRole.role.permissions
          ? userRole.role.permissions.some((p: any) => p.name === permission)
          : false
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        code: "FORBIDDEN",
        message: "Insufficient permissions" 
      });
    }

    next();
  };
}