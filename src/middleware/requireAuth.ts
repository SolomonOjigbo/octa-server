// src/middleware/requireAuth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from "@shared/infra/database/prisma";
import { auditService } from '../modules/audit/services/audit.service';
import { AuditAction } from '../modules/audit/types/audit.dto';
import { ForbiddenError, UnauthorizedError } from './errors';
import { PERMISSIONS } from '../prisma/permissionsAndRoles';



// Shape of the JWT payload you sign in your auth.service:
interface JwtPayload {
  userId:      string;
  tenantId:    string;
  storeId?:    string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id:           string;
        tenantId:     string;
        storeId?:     string;
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
    payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('Token expired'));
    }
    return next(new UnauthorizedError('Invalid token'));
  }

  // 2. Load user + roles + role->permissions
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      roles: {
        include: {
          role: {
            include: { permissions: true },
          },
        },
      },
    },
  });

  // 3. Deny if not found or inactive
  if (!user || !user.isActive) {
    await auditService.log({
      tenantId: payload.tenantId,
      userId:   payload.userId,
      module:   'Auth',
      action:   AuditAction.PERMISSION_DENIED,
      entityId: payload.userId,
      metadata: {
        ip:        req.ip,
        userAgent: req.get('user-agent') || '',
      },
    });
    return next(new ForbiddenError('Account inactive or not found'));
  }

  // 4. Build role & permission lists
  const roleNames = user.roles.map((ur) => ur.role.name);
  const perms = new Set<string>(PERMISSIONS);
  for (const ur of user.roles) {
    for (const p of ur.role.permissions) {
      perms.add(p.name);
    }
  }

  // 5. Determine admin flags
  const isSuperAdmin = roleNames.includes('super_admin');
  const isAdmin      = isSuperAdmin || roleNames.includes('admin');

  // 6. Attach to req.user
  req.user = {
    id:           user.id,
    tenantId:     user.tenantId,
    storeId:      user.storeId ?? undefined,
    isActive:     user.isActive,
    isSuperAdmin,
    isAdmin,
    roles:        roleNames,
    permissions:  Array.from(perms),
  };

  return next();
}
