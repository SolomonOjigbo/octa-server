import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { requireAuth } from "../../../middleware/requireAuth";
import { requirePermission } from "../../../middleware/requirePermission";
import { rateLimiter } from "../../../middleware/rateLimiter";

const router = Router();

// Apply rate limiting to all user routes
router.use(rateLimiter(15, 100)); // 15 requests per 100 seconds

// Create user
router.post(
  "/",
  requireAuth,
  requirePermission("user:create"),
  userController.createUser.bind(userController)
);

// Get users with pagination
router.get(
  "/",
  requireAuth,
  requirePermission("user:read"),
  userController.getUsers.bind(userController)
);

// Get single user
router.get(
  "/:id",
  requireAuth,
  requirePermission("user:read"),
  userController.getUserById.bind(userController)
);

// Update user
router.put(
  "/:id",
  requireAuth,
  requirePermission("user:update"),
  userController.updateUser.bind(userController)
);

// Deactivate user (soft delete)
router.patch(
  "/:id/deactivate",
  requireAuth,
  requirePermission("user:delete"),
  userController.deactivateUser.bind(userController)
);

// Delete user (hard delete)
router.delete(
  "/:id",
  requireAuth,
  requirePermission("user:delete"),
  userController.deleteUser.bind(userController)
);

export default router;