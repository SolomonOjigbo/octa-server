
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { add, isAfter } from "date-fns";
import { signJwt, verifyJwt } from "../utils/jwt";
import { sessionService } from "../services/session.service";
import prisma from "@shared/infra/database/prisma";
import { eventBus } from "@events/eventBus";
import { EVENTS } from "@events/events";
import { storeService } from "@modules/store/services/store.service";
import { roleService } from "@modules/role/services/role.service";


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
      storeId: user.storeId,
      warehouseId: user.warehouseId 
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

    if (!user.isEmailVerified) {
    // Optionally: auto-resend verification email
    this.sendVerificationEmail(user.id);
    throw new Error("Email not verified. Verification email resent.");
  }

    return { 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
        storeId: user.storeId,
        warehouseId: user.warehouseId,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
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

    
  eventBus.emit(EVENTS.PASSWORD_RESET_REQUESTED, {
    email: user.email,
    resetToken: token,
    expiresAt: expiresAt.toISOString(), // Add timezone context
    tenantId: user.tenantId // Add tenant context
  });
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

  async inviteUser(tenantId: string, email: string, name?: string, roleId?: string, storeId?: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("User already exists");
    }

    const inviteToken = uuidv4();
    const expiresAt = add(new Date(), { days: 7 });

   const user = await prisma.user.create({
      data: {
        tenant: {connect: {id: tenantId}},
        email,
        name: name || "",
        password: "",
        isActive: false,
        inviteToken,
        inviteExpires: expiresAt,
        store: {connect: {id: storeId}},
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
    const store = await storeService.getStoreById(user.storeId)
    const role = await roleService.getRoleById(roleId)

    eventBus.emit(EVENTS.USER_INVITED, {
    email: user.email,
    name,
    inviteToken,
    inviteExpires: expiresAt,
    store: store,
    tenantId,
    role: role.name
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
    const store = await storeService.getStoreById(user.storeId)
      eventBus.emit(EVENTS.USER_ACTIVATED, {
        email: user.email,
        userId: user?.id,
        tenantId: user?.tenantId,
        name: user.name,
        store,
      });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      tenantId: updatedUser.tenantId
    };
  }

async sendVerificationEmail(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  
  const verifyToken = uuidv4();
  const verifyExpires = add(new Date(), { hours: 24 });
  
  await prisma.user.update({
    where: { id: userId },
    data: { verifyToken, verifyExpires }
  });

  eventBus.emit(EVENTS.EMAIL_VERIFICATION_REQUESTED, {
    email: user.email,
    verifyToken,
    userId: user.id,
    tenantId: user.tenantId
  });
}

async verifyEmail(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      verifyToken: token,
      verifyExpires: { gt: new Date() }
    }
  });
  
  if (!user) throw new Error("Invalid token");
  
  return prisma.user.update({
    where: { id: user.id },
    data: { 
      isEmailVerified: true,
      verifyToken: null,
      verifyExpires: null
    }
  });
}
}

export const authService = new AuthService();