import { Router } from "express";
import { sessionController } from "../controllers/session.controller";
import { requireAuth } from "../../../middleware/requireAuth";

const router = Router();

// Protected session routes
router.get("/sessions", requireAuth, sessionController.listSessions.bind(sessionController));
router.delete("/sessions/:sessionId", requireAuth, sessionController.revokeSession.bind(sessionController));
router.delete("/sessions", requireAuth, sessionController.revokeAllSessions.bind(sessionController));

export default router;