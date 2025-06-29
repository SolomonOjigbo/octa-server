import { Router } from "express";
import { tenantController } from "../controllers/tenant.controller";
import { requireAuth } from "../../../middleware/requireAuth";
import { requirePermission } from "../../../middleware/requirePermission";
// import { validate } from "../../common/middleware/validate";
import { createTenantSchema, updateTenantSchema } from "../validations";

const router = Router();

// Tenant CRUD routes
router.post(
  "/",
  requireAuth,
  requirePermission("tenant:create"),
  tenantController.createTenant.bind(tenantController)
);

router.get(
  "/",
  requireAuth,
  requirePermission("tenant:read"),
  tenantController.getTenants.bind(tenantController)
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("tenant:read"),
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
  requirePermission("tenant:read"),
  tenantController.getTenantsWithB2B.bind(tenantController)
);

export default router;