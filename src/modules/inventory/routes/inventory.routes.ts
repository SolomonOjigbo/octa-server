import { Router } from "express";
import { inventoryController } from "../controllers/inventory.controller";
import { requirePermission } from "@middleware/requirePermission";
import { requireAuth } from "@middleware/requireAuth";

const router = Router();
// Middleware to ensure all routes require authentication
router.use(requireAuth); // Uncomment if authentication is required for all routes


 /**
   * @swagger
   * /inventory:
   *   post:
   *     summary: Create a new inventory movement
   *     tags: [Inventory]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateInventoryMovementDto'
   *     responses:
   *       201:
   *         description: Inventory movement created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/InventoryResponse'
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   */
router.post("/",
     requirePermission('inventory:create'),
     inventoryController.createMovement.bind(inventoryController)
     ); // Create new inventory movement

 /**
   * @swagger
   * /inventory:
   *   get:
   *     summary: Get inventory movements with filtering
   *     tags: [Inventory]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: tenantId
   *         schema:
   *           type: string
   *         required: true
   *         description: Tenant ID
   *       - in: query
   *         name: productId
   *         schema:
   *           type: string
   *         description: Filter by product ID
   *       - in: query
   *         name: variantId
   *         schema:
   *           type: string
   *         description: Filter by product variant ID
   *       - in: query
   *         name: storeId
   *         schema:
   *           type: string
   *         description: Filter by store ID
   *       - in: query
   *         name: warehouseId
   *         schema:
   *           type: string
   *         description: Filter by warehouse ID
   *       - in: query
   *         name: movementType
   *         schema:
   *           type: string
   *         description: Filter by movement type (IN, OUT, ADJUST, etc.)
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filter by start date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filter by end date
   *       - in: query
   *         name: reference
   *         schema:
   *           type: string
   *         description: Filter by reference
   *       - in: query
   *         name: batchNumber
   *         schema:
   *           type: string
   *         description: Filter by batch number
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Items per page
   *     responses:
   *       200:
   *         description: List of inventory movements
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/InventoryResponse'
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   */
router.get("/",
        requirePermission('inventory:read'),
     inventoryController.getMovements.bind(inventoryController)
     ); // Get inventory movements with filtering

/**
   * @swagger
   * /inventory/{id}:
   *   get:
   *     summary: Get a specific inventory movement
   *     tags: [Inventory]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: tenantId
   *         schema:
   *           type: string
   *         required: true
   *         description: Tenant ID
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: Inventory movement ID
   *     responses:
   *       200:
   *         description: Inventory movement details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/InventoryResponse'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Movement not found
   */
router.get("/:id",
        requirePermission('inventory:read'),
     inventoryController.getMovementById.bind(inventoryController)
     ); // Get a specific inventory movement by ID

/**
   * @swagger
   * /inventory/{id}:
   *   put:
   *     summary: Update an inventory movement
   *     tags: [Inventory]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: tenantId
   *         schema:
   *           type: string
   *         required: true
   *         description: Tenant ID
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: Inventory movement ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateInventoryMovementDto'
   *     responses:
   *       200:
   *         description: Updated inventory movement
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/InventoryResponse'
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Movement not found
   */
router.put("/:id",
        requirePermission('inventory:update'),
     inventoryController.updateMovement.bind(inventoryController)
     ); // Update an inventory movement by ID

/**
   * @swagger
   * /inventory/{id}:
   *   delete:
   *     summary: Delete an inventory movement
   *     tags: [Inventory]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: tenantId
   *         schema:
   *           type: string
   *         required: true
   *         description: Tenant ID
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: Inventory movement ID
   *     responses:
   *       204:
   *         description: Movement deleted
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Movement not found
   */
router.delete("/:id",
        requirePermission('inventory:delete'),
     inventoryController.deleteMovement.bind(inventoryController)
     ); // Delete an inventory movement by ID

export default router;
