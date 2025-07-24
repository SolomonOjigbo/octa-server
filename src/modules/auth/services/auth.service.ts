
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { add, isAfter } from "date-fns";
import { signJwt, verifyJwt } from "../utils/jwt";
import { sessionService } from "../services/session.service";
import prisma from "@shared/infra/database/prisma";


export class AuthService {
  async login(email: string, password: string, ip?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { tenant: true }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error("Invalid credentials");
    }

    if (!user.isActive) {
      throw new Error("Account disabled");
    }

    // Generate tokens
    const accessToken = signJwt({ 
      userId: user.id, 
      tenantId: user.tenantId,
      storeId: user.storeId || undefined,
    });

    const refreshToken = await sessionService.createSession({
      userId: user.id,
      ipAddress: ip,
      userAgent,
      tenantId: user.tenantId
    });

    // Update last login
    await prisma.user.update({ 
      where: { id: user.id }, 
      data: { lastLogin: new Date() } 
    });

    return { 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
        storeId: user.storeId,
      },
      accessToken,
      refreshToken
    };
  }

  async refresh(refreshToken: string, ip?: string) {
    const session = await sessionService.validateSession(refreshToken);

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { tenant: true }
    });

    if (!user || !user.isActive) {
      throw new Error("User not found or inactive");
    }

    // Generate new access token
    const accessToken = signJwt({
      userId: user.id,
      tenantId: user.tenantId,
      storeId: user.storeId || undefined,
    });

    // Update session info
    await sessionService.updateSession(session.id, { ipAddress: ip });

    return { accessToken };
  }

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Security: don't reveal if user exists

    // Invalidate any existing tokens
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    const token = uuidv4();
    const expiresAt = add(new Date(), { hours: 1 });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expiresAt
      }
    });

    // TODO: Send email with reset link
    return token;
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() }
      }
    });

    if (!user) throw new Error("Invalid or expired token");

    const hash = await bcrypt.hash(newPassword, 10);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hash,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    // Revoke all sessions for this user
    await sessionService.revokeAllSessions(user.id);

    return updatedUser;
  }

  async inviteUser(tenantId: string, email: string, name?: string, roleId?: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("User already exists");
    }

    const inviteToken = uuidv4();
    const expiresAt = add(new Date(), { days: 7 });

    await prisma.user.create({
      data: {
        tenantId,
        email,
        name: name || "",
        password: "",
        isActive: false,
        inviteToken,
        inviteExpires: expiresAt,
        ...(roleId && {
          roles: {
            create: {
              tenantId,
              roleId,
              assignedBy: "system",
              assignedAt: new Date()
            }
          }
        })
      }
    });

    return inviteToken;
  }

  async activateUser(inviteToken: string, password: string, name?: string) {
    const user = await prisma.user.findFirst({
      where: {
        inviteToken,
        inviteExpires: { gt: new Date() },
        isActive: false
      }
    });

    if (!user) throw new Error("Invalid or expired invite token");

    const hash = await bcrypt.hash(password, 10);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hash,
        isActive: true,
        inviteToken: null,
        inviteExpires: null,
        ...(name && { name })
      },
      include: { tenant: true }
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      tenantId: updatedUser.tenantId
    };
  }
}

export const authService = new AuthService();