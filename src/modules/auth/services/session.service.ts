import prisma from "@shared/infra/database/prisma";
import { add, isAfter } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { redisClient } from "../../../middleware/cache";
import { SessionInfo, CreateSessionDto, UpdateSessionDto, SessionResponse } from "../types/session.dto";


export class SessionService {
  private readonly SESSION_EXPIRY_DAYS = 7;
  private readonly CACHE_PREFIX = "session:";

  async createSession(sessionData: CreateSessionDto): Promise<string> {
    const token = uuidv4();
    const expiresAt = add(new Date(), { days: this.SESSION_EXPIRY_DAYS });

    const session = await prisma.refreshToken.create({
      data: {
        userId: sessionData.userId,
        tenantId: sessionData.tenantId,
        token,
        expiresAt,
      }
    });

    // 2. Manually build your full SessionInfo
const sessionInfo: SessionInfo = {
  id:         session.id,
  userId:     session.userId,
  token:      session.token,
  expiresAt:  session.expiresAt,
  createdAt:  session.createdAt,
  tenantId:   session.tenantId,    
  ipAddress:  sessionData.ipAddress, // now TS knows this isn’t part of the DB call
  userAgent:  sessionData.userAgent,
};

// 3. Cache and return the enriched object
    await this.cacheSession(session);

    return token;
  }

  async validateSession(token: string): Promise<SessionInfo> {
    // Try cache first
    const cachedSession = await this.getCachedSession(token);
    if (cachedSession) {
      if (isAfter(new Date(), cachedSession.expiresAt)) {
        await this.revokeSession(token);
        throw new Error("Session expired");
      }
      return cachedSession;
    }

    // Fallback to database
    const session = await prisma.refreshToken.findUnique({
      where: { token }
    });

    if (!session || isAfter(new Date(), session.expiresAt)) {
      throw new Error("Invalid or expired session");
    }

    await this.cacheSession(session);
    return session;
  }

  async updateSession(token: string, updates: UpdateSessionDto): Promise<SessionInfo> {
    const session = await prisma.refreshToken.update({
      where: { token },
      data: updates
    });

    await this.cacheSession(session);
    return session;
  }

  async revokeSession(token: string, userId?: string): Promise<void> {
    await redisClient.del(`${this.CACHE_PREFIX}${token}`);

    await prisma.refreshToken.deleteMany({
      where: {
        token,
        ...(userId && { userId })
      }
    });
  }

  async revokeAllSessions(userId: string): Promise<void> {
    const sessions = await prisma.refreshToken.findMany({
      where: { userId }
    });

    await Promise.all(
      sessions.map(session => 
        redisClient.del(`${this.CACHE_PREFIX}${session.token}`)
      )
    );

    await prisma.refreshToken.deleteMany({
      where: { userId }
    });
  }

  async getUserSessions(userId: string): Promise<SessionResponse[]> {
    const sessions = await prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return sessions.map(session => ({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt
    }));
  }

  private async cacheSession(session: SessionInfo): Promise<void> {
    await redisClient.set(
      `${this.CACHE_PREFIX}${session.token}`,
      JSON.stringify({
        id: session.id,
        userId: session.userId,
        tenantId: session.tenantId,
        expiresAt: session.expiresAt.toISOString(),
        ipAddress: session.ipAddress,
        userAgent: session.userAgent
      }),
      { ttl: 60 * 60 * 24 * this.SESSION_EXPIRY_DAYS }
    );
  }

  private async getCachedSession(token: string): Promise<SessionInfo | null> {
    const cached = await redisClient.get(`${this.CACHE_PREFIX}${token}`);
    if (!cached) return null;

    const session = JSON.parse(cached);
    return {
      ...session,
      expiresAt: new Date(session.expiresAt)
    };
  }
}

export const sessionService = new SessionService();