import { Router } from "express";
import { roleController } from "../controllers/role.controller";
import { requireAuth } from "@middleware/requireAuth";
import { requirePermission } from "@middleware/requirePermission";

const router = Router();

// Create Role
router.post(
  "/",
  requireAuth,
  requirePermission("role:create"),
  roleController.createRole.bind(roleController)
);

// List Roles
router.get(
  "/",
  requireAuth,
  requirePermission("role:view"),
  roleController.getRoles.bind(roleController)
);

// Get Role by ID
router.get(
  "/:id",
  requireAuth,
  requirePermission("role:view"),
  roleController.getRoleById.bind(roleController)
);

// Update Role
router.put(
  "/:id",
  requireAuth,
  requirePermission("role:update"),
  roleController.updateRole.bind(roleController)
);

// Delete Role
router.delete(
  "/:id",
  requireAuth,
  requirePermission("role:delete"),
  roleController.deleteRole.bind(roleController)
);

export default router;
