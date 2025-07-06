// src/modules/businessEntity/routes/businessEntity.routes.ts

import { Router } from "express";
import { businessEntityController } from "../controllers/businessEntity.controller";
import { requireAuth } from "@middleware/requireAuth";
import { requirePermission } from "@middleware/requirePermission";

const router = Router();

router.post(
  "/",
  requireAuth,
  requirePermission("business_entity:create"),
  businessEntityController.createEntity.bind(businessEntityController)
);

router.get(
  "/",
  requireAuth,
  requirePermission("business_entity:view"),
  businessEntityController.getEntities.bind(businessEntityController)
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("business_entity:view"),
  businessEntityController.getEntityById.bind(businessEntityController)
);

router.put(
  "/:id",
  requireAuth,
  requirePermission("business_entity:update"),
  businessEntityController.updateEntity.bind(businessEntityController)
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("business_entity:delete"),
  businessEntityController.deleteEntity.bind(businessEntityController)
);
export default router;