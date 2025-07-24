import { Request, Response } from "express";
import { sessionService } from "../services/session.service";
import { requireAuth } from "../../../middleware/requireAuth";
import { auditService } from "../../audit/services/audit.service";
import { AuditAction } from "../../audit/types/audit.dto";

export class SessionController {
  async listSessions(req: Request, res: Response) {
    if (!req.user) throw new Error("Unauthorized");

    const sessions = await sessionService.getUserSessions(req.user.id);
    
    // Mark current session
    const currentSessionToken = req.body.currentToken || req.headers['x-session-token'];
    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      isCurrent: session.id === currentSessionToken
    }));

    res.json({ sessions: sessionsWithCurrent });
  }

  async revokeSession(req: Request, res: Response) {
    if (!req.user) throw new Error("Unauthorized");

    const { sessionId } = req.params;
    await sessionService.revokeSession(sessionId, req.user.id);

    await auditService.log({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      action: AuditAction.SESSION_REVOKED,
      module: "Session",
      entityId: sessionId
    });

    res.json({ success: true });
  }

  async revokeAllSessions(req: Request, res: Response) {
    if (!req.user) throw new Error("Unauthorized");

    await sessionService.revokeAllSessions(req.user.id);

    await auditService.log({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      action: AuditAction.SESSIONS_REVOKED_ALL,
      module: "User",
      entityId: req.user.id
    });

    res.json({ success: true });
  }
}

export const sessionController = new SessionController();