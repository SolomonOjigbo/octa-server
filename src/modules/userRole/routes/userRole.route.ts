import { Router } from "express";
import { userRoleController } from "../controllers/userRole.controller";
import { requireAuth } from "@middleware/requireAuth";
import { requirePermission } from "@middleware/requirePermission";

const router = Router();

// Assign role
router.post(
  "/",
  requireAuth,
  requirePermission("user_role:create"),
  userRoleController.assignRole.bind(userRoleController)
);

// Remove role
router.delete(
  "/",
  requireAuth,
  requirePermission("user_role:delete"),
  userRoleController.removeRole.bind(userRoleController)
);

// Get roles for a user
router.get(
  "/users/:userId",
  requireAuth,
  requirePermission("user_role:view"),
  userRoleController.getUserRoles.bind(userRoleController)
);

// Get users for a role
router.get(
  "/roles/:roleId",
  requireAuth,
  requirePermission("user_role:view"),
  userRoleController.getRoleUsers.bind(userRoleController)
);

export default router;
