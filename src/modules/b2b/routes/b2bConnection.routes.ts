import { Router } from "express";
import { b2bConnectionController } from "../controllers/b2bConnection.controller";
import { requireAuth } from "@middleware/requireAuth";
import { requirePermission } from "@middleware/requirePermission";

const router = Router();
router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   - name: B2BConnections
 *     description: Manage cross-tenant B2B relationships
 */

/**
 * @swagger
 * /b2b-connections:
 *   get:
 *     tags: [B2BConnections]
 *     summary: List all B2B connections for current tenant
 *     security: [bearerAuth: []]
 *     responses:
 *       200:
 *         description: Array of connections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/B2BConnectionResponseDto'
 */
router.get(
  '/',
  requirePermission('b2b:read'),
  b2bConnectionController.list
);

/**
 * @swagger
 * /b2b-connections/{id}:
 *   get:
 *     tags: [B2BConnections]
 *     summary: Get a single B2B connection by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Connection record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/B2BConnectionResponseDto'
 */
router.get(
  '/:id',
  requirePermission('b2b:read'),
  b2bConnectionController.getById
);

/**
 * @swagger
 * /b2b-connections:
 *   post:
 *     tags: [B2BConnections]
 *     summary: Request a new B2B connection
 *     security: [bearerAuth: []]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateB2BConnectionDto'
 *     responses:
 *       201:
 *         description: Created connection
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/B2BConnectionResponseDto'
 */
router.post(
  '/',
  requirePermission('b2b:create'),
  b2bConnectionController.create
);

/**
 * @swagger
 * /b2b-connections/{id}/approve:
 *   patch:
 *     tags: [B2BConnections]
 *     summary: Approve a pending B2B connection
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Connection approved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/B2BConnectionResponseDto'
 */
router.patch(
  '/:id/approve',
  requirePermission('b2b:update'),
  b2bConnectionController.approve
);

/**
 * @swagger
 * /b2b-connections/{id}/reject:
 *   patch:
 *     tags: [B2BConnections]
 *     summary: Reject a pending B2B connection
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConnectionActionDto'
 *     responses:
 *       200:
 *         description: Connection rejected
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/B2BConnectionResponseDto'
 */
router.patch(
  '/:id/reject',
  requirePermission('b2b:update'),
  b2bConnectionController.reject
);

/**
 * @swagger
 * /b2b-connections/{id}/revoke:
 *   patch:
 *     tags: [B2BConnections]
 *     summary: Revoke or cancel a B2B connection
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConnectionActionDto'
 *     responses:
 *       200:
 *         description: Connection revoked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/B2BConnectionResponseDto'
 */
router.patch(
  '/:id/revoke',
  requirePermission('b2b:update'),
  b2bConnectionController.revoke
);

export default router;
