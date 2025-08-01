// src/middleware/requireAuth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from "@shared/infra/database/prisma";
import { auditService } from '../modules/audit/services/audit.service';
import { AuditAction } from '../modules/audit/types/audit.dto';
import { ForbiddenError, UnauthorizedError } from './errors';
import { redisClient } from './cache';
import { JwtPayload, verifyJwt } from '@modules/auth/utils/jwt';
import { permissionService } from '@modules/role/services/permission.service';



declare global {
  namespace Express {
    interface Request {
      user?: {
        id:           string;
        tenantId:     string;
        storeId?:     string;
        warehouseId?: string;
        isActive:     boolean;
        isSuperAdmin: boolean;
        isAdmin:      boolean;
        roles:        string[];
        permissions:  string[];
      };
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 1. Extract & verify token
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }
  const token = auth.slice(7);

  let payload: JwtPayload;
  try {
    payload = verifyJwt(token) as JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('Token expired'));
    }
    return next(new UnauthorizedError('Invalid token'));
  }

  // Check token invalidation
  const isInvalidated = await redisClient.get(`token:invalid:${payload.jti}`);
  if (isInvalidated) {
    return next(new UnauthorizedError("Token invalidated"));
  }

  // 2. Get user without permissions
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      tenantId: true,
      storeId: true,
      warehouseId: true, // Added warehouseId
      isActive: true,
      roles: {
        select: {
          role: {
            select: { name: true }
          }
        }
      }
    }
  });

  // 3. Deny if not found or inactive
  if (!user || !user.isActive) {
    await auditService.log({
      tenantId: payload.tenantId,
      userId: payload.userId,
      module: 'Auth',
      action: AuditAction.PERMISSION_DENIED,
      entityId: payload.userId,
      metadata: {
        ip: req.ip,
        userAgent: req.get('user-agent') || '',
      },
    });
    return next(new ForbiddenError('Account inactive or not found'));
  }

  // 4. Load permissions AFTER validation
  const permissions = await permissionService.getUserPermissions(user.id);
  
  const roleNames = user.roles.map(ur => ur.role.name);
  const isSuperAdmin = roleNames.includes('superAdmin');
  const isAdmin = isSuperAdmin || roleNames.includes('globalAdmin') || roleNames.includes('tenantAdmin');

  // 5. Attach to request
  req.user = {
    id: user.id,
    tenantId: user.tenantId,
    storeId: user.storeId ?? undefined,
    warehouseId: user.warehouseId ?? undefined, // Added warehouseId
    isActive: user.isActive,
    isSuperAdmin,
    isAdmin,
    roles: roleNames,
    permissions,
  };

  return next();
}
