import { Router } from "express";
import { tenantController } from "../controllers/tenant.controller";
import { requireAuth } from "../../../middleware/requireAuth";
import { requirePermission } from "../../../middleware/requirePermission";

const router = Router();

// Tenant CRUD routes
router.post(
  "/onboard",
  tenantController.atomicTenantOnboarding.bind(tenantController)
);

// Get all tenants (admin only)
router.get(
  "/",
  requireAuth,
  requirePermission("tenant:view"),
  tenantController.getTenants.bind(tenantController)
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("tenant:view"),
  tenantController.getTenantById.bind(tenantController)
);

router.put(
  "/:id",
  requireAuth,
  requirePermission("tenant:update"),
  tenantController.updateTenant.bind(tenantController)
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("tenant:delete"),
  tenantController.deleteTenant.bind(tenantController)
);

// B2B Connections
router.get(
  "/b2b/connections",
  requireAuth,
  requirePermission("tenant:view"),
  tenantController.getTenantsWithB2B.bind(tenantController)
);

export default router;