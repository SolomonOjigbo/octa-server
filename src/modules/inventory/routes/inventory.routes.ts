// src/modules/inventory/inventory.routes.ts

import { Router } from 'express';
import { requireAuth } from '@middleware/requireAuth';
import { requirePermission } from '@middleware/requirePermission';
import { inventoryController } from '../controllers/inventory.controller';

const router = Router();
router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   - name: Inventory
 *     description: Inventory movement records
 */

/**
 * @swagger
 * /inventory:
 *   get:
 *     tags: [Inventory]
 *     summary: List all inventory movements
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of inventory records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InventoryResponseDto'
 */
router.get(
  '/',
  requirePermission('inventory:read'),
  inventoryController.getMovements
);

/**
 * @swagger
 * /inventory/search:
 *   post:
 *     tags: [Inventory]
 *     summary: Filter or search inventory movement records
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InventorySearchDto'
 *     responses:
 *       200:
 *         description: Filtered inventory records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InventoryResponseDto'
 */
router.post(
  '/search',
  requirePermission('inventory:read'),
  inventoryController.searchMovements
);

/**
 * @swagger
 * /inventory/{id}:
 *   get:
 *     tags: [Inventory]
 *     summary: Get a single inventory record by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Inventory record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryResponseDto'
 */
router.get(
  '/:id',
  requirePermission('inventory:read'),
  inventoryController.getById
);

/**
 * @swagger
 * /inventory:
 *   post:
 *     tags: [Inventory]
 *     summary: Create a new inventory movement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InventoryMovementDto'
 *     responses:
 *       201:
 *         description: Created inventory record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryResponseDto'
 */
router.post(
  '/',
  requirePermission('inventory:create'),
  inventoryController.createMovement
);

/**
 * @swagger
 * /inventory/{id}:
 *   patch:
 *     tags: [Inventory]
 *     summary: Update an inventory record (only metadata, batch, expiry)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateInventoryMovementDto'
 *     responses:
 *       200:
 *         description: Updated inventory record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryResponseDto'
 */
router.patch(
  '/:id',
  requirePermission('inventory:update'),
  inventoryController.updateMovement
);

/**
 * @swagger
 * /inventory/{id}/void:
 *   post:
 *     tags: [Inventory]
 *     summary: Void an inventory record (admin only)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Duplicate entry"
 *     responses:
 *       200:
 *         description: Voided inventory record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryResponseDto'
 */
router.post(
  '/:id/void',
  requirePermission('inventory:delete'),
  inventoryController.voidMovement
);

/**
 * @swagger
 * /inventory/{id}:
 *   delete:
 *     tags: [Inventory]
 *     summary: Permanently delete an inventory record (super admin only)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Deleted
 */
router.delete(
  '/:id',
  requirePermission('inventory:super:delete'),
  inventoryController.deleteMovement
);

export default router;
