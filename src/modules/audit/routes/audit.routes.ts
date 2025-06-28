import { Router } from "express";
import { auditController } from "../controllers/audit.controller";
import { requireAuth } from "../../../middleware/requireAuth";
import { requirePermission } from "../../../middleware/requirePermission";
import { validateAuditQuery } from "../validations";
import { rateLimiter } from "../../../middleware/rateLimiter";

const router = Router();

router.get(
  "/",
  rateLimiter(30, 60), // 30 requests per minute
  requireAuth,
  requirePermission("audit:view"),
  validateAuditQuery,
  auditController.getAuditLogs.bind(auditController)
);

router.delete(
  "/purge",
  rateLimiter(5, 60 * 60), // 5 requests per hour
  requireAuth,
  requirePermission("audit:purge"),
  auditController.purgeAuditLogs.bind(auditController)
);

export default router;