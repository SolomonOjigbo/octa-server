import { Router } from "express";
import { b2bConnectionController } from "../controllers/b2bConnection.controller";
import { requireAuth } from "../../../middleware/requireAuth";
import { requirePermission } from "../../../middleware/requirePermission";
import { 
  createB2BConnectionSchema, 
  updateB2BConnectionSchema 
} from "../validations";

const router = Router();

// B2B Connection CRUD routes
router.post(
  "/",
  requireAuth,
  requirePermission("b2b:create"),
  b2bConnectionController.createConnection.bind(b2bConnectionController)
);

router.get(
  "/",
  requireAuth,
  requirePermission("b2b:read"),
  b2bConnectionController.listConnectionsForTenant.bind(b2bConnectionController)
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("b2b:read"),
  b2bConnectionController.getConnectionById.bind(b2bConnectionController)
);

router.put(
  "/:id",
  requireAuth,
  requirePermission("b2b:update"),
  b2bConnectionController.updateConnection.bind(b2bConnectionController)
);

router.put(
  "/:id/approve",
  requireAuth,
  requirePermission("b2b:approve"),
  b2bConnectionController.approveConnection.bind(b2bConnectionController)
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("b2b:delete"),
  b2bConnectionController.deleteConnection.bind(b2bConnectionController)
);

export default router;