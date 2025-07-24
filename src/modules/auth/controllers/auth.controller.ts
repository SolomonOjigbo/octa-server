import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { sessionService } from "../services/session.service";
import {
  loginSchema,
  inviteUserSchema,
  activateUserSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  logoutSchema,
} from "../validations";
import { 

  InviteUserDto,
  ActivateUserDto,
  RefreshTokenDto,
  LogoutDto
} from "../types/auth.dto";
import { AuditAction } from "../../audit/types/audit.dto";
import { auditService } from "../../audit/services/audit.service";

export class AuthController {
  async login(req: Request, res: Response) {
    const validated = loginSchema.parse(req.body);
    const { ip, headers } = req;
    const userAgent = headers['user-agent'] || '';

    const result = await authService.login(
      validated.email, 
      validated.password,
      ip,
      userAgent
    );

    await auditService.log({
      userId: result.user.id,
      tenantId: result.user.tenantId,
      action: AuditAction.USER_LOGIN,
      module: "User",
      entityId: result.user.id,
  
    });

    res.json(result);
  }

  async refresh(req: Request, res: Response) {
    const validated = refreshTokenSchema.parse(req.body);
    const { ip } = req;
    
    const result = await authService.refresh(
      validated.refreshToken,
      ip
    );

    res.json(result);
  }

  async logout(req: Request, res: Response) {
    const validated = logoutSchema.parse(req.body);
    const { user } = req;
    
    if (user) {
      await sessionService.revokeSession(
        validated.refreshToken,
        user.id
      );

      await auditService.log({
        userId: user.id,
        tenantId: user.tenantId,
        action: AuditAction.USER_LOGOUT,
        module: "User",
        entityId: user.id
      });
    }

    res.json({ success: true });
  }

  async inviteUser(req: Request, res: Response) {
    const validated = inviteUserSchema.parse(req.body) as InviteUserDto;
    const { user } = req;
    
    if (!user) throw new Error("Unauthorized");

    const inviteToken = await authService.inviteUser(
      validated.tenantId,
      validated.email,
      validated.name,
      validated.roleId
    );

    await auditService.log({
      userId: user.id,
      tenantId: user.tenantId,
      action: AuditAction.USER_INVITED,
      module: "User",
      entityId: validated.email,
    });

    res.json({ success: true, inviteToken });
  }

  async activateUser(req: Request, res: Response) {
    const validated = activateUserSchema.parse(req.body) as ActivateUserDto;
    const user = await authService.activateUser(
      validated.inviteToken,
      validated.password,
      validated.name
    );

    await auditService.log({
      userId: user.id,
      tenantId: user.tenantId,
      action: AuditAction.USER_ACTIVATED,
      module: "User",
      entityId: user.id
    });

    res.json({ user });
  }

  async requestPasswordReset(req: Request, res: Response) {
    const validated = requestPasswordResetSchema.parse(req.body);
    await authService.requestPasswordReset(validated.email);
    res.json({ success: true });
  }

  async resetPassword(req: Request, res: Response) {
    const validated = resetPasswordSchema.parse(req.body);
    const user = await authService.resetPassword(
      validated.token,
      validated.password
    );

    if (user) {
      await auditService.log({
        userId: user.id,
        tenantId: user.tenantId,
        action: AuditAction.PASSWORD_RESET,
        module: "User",
        entityId: user.id
      });
    }

    res.json({ success: true });
  }
}

export const authController = new AuthController();