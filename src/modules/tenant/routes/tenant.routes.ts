import { Router } from "express";
import { tenantController } from "../controllers/tenant.controller";

const router = Router();
router.post("/", tenantController.createTenant.bind(tenantController));
router.get("/", tenantController.getTenants.bind(tenantController));
router.get("/:id", tenantController.getTenantById.bind(tenantController));
router.put("/:id", tenantController.updateTenant.bind(tenantController));
export default router;
