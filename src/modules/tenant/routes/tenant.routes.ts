import { Router } from "express";
import { tenantController } from "../controllers/tenant.controller";
import { requireAuth } from "../../../middleware/requireAuth";
import { requirePermission } from "../../../middleware/requirePermission";

const router = Router();
router.post("/", requireAuth,
  requirePermission("create_tenant"), tenantController.createTenant.bind(tenantController));
router.get("/", tenantController.getTenants.bind(tenantController));
router.get("/:id", tenantController.getTenantById.bind(tenantController));
router.put("/:id", tenantController.updateTenant.bind(tenantController));
export default router;
