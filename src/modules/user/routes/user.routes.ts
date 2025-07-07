import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { requireAuth } from "@middleware/requireAuth";
import { requirePermission } from "@middleware/requirePermission";

const router = Router();

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUser'
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.post(
  "/",
  requireAuth,
  requirePermission("user:create"),
  userController.createUser.bind(userController)
);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users in tenant
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Forbidden
 */
router.get(
  "/",
  requireAuth,
  requirePermission("user:view"),
  userController.getUsers.bind(userController)
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: User object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Not found
 *       403:
 *         description: Forbidden
 *   put:
 *     summary: Update user by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUser'
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.get(
  "/:id",
  requireAuth,
  requirePermission("user:view"),
  userController.getUserById.bind(userController)
);
router.put(
  "/:id",
  requireAuth,
  requirePermission("user:update"),
  userController.updateUser.bind(userController)
);

export default router;
