import { Router } from "express";
import { auditController } from "../controllers/audit.controller";

const router = Router();
router.get("/", auditController.getAuditLogs.bind(auditController));
export default router;
