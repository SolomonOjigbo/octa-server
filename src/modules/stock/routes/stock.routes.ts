import { Router } from "express";
import { stockController } from "../controllers/stock.controller";
import { requireAuth } from "@middleware/requireAuth";
import { requirePermission } from "@middleware/requirePermission";
import { rateLimiter } from "@middleware/rateLimiter";

const router = Router();

router.use(requireAuth); // Ensure all routes require authentication
// Apply rate limiting

router.use(rateLimiter(100, 60 * 1000)); // 100 requests per minute


// No public routes for stock management, all operations require authentication and permissions
// Protected routes
/**
   * @swagger
   * /stock:
   *   get:
   *     summary: Get stock levels with filtering
   *     tags: [Stock]
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
   *         name: minQuantity
   *         schema:
   *           type: number
   *         description: Minimum stock quantity
   *       - in: query
   *         name: maxQuantity
   *         schema:
   *           type: number
   *         description: Maximum stock quantity
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
   *         description: List of stock levels
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
   *                     $ref: '#/components/schemas/StockResponse'
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   */
router.get("/", requirePermission('inventory:read'), stockController.getStockLevels.bind(stockController)); // Query/filter stock

/**
   * @swagger
   * /stock/{productId}:
   *   get:
   *     summary: Get stock for a specific product at a location
   *     tags: [Stock]
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
   *         name: productId
   *         schema:
   *           type: string
   *         required: true
   *         description: Product ID
   *       - in: query
   *         name: variantId
   *         schema:
   *           type: string
   *         description: Product variant ID
   *       - in: query
   *         name: storeId
   *         schema:
   *           type: string
   *         description: Store ID
   *       - in: query
   *         name: warehouseId
   *         schema:
   *           type: string
   *         description: Warehouse ID
   *     responses:
   *       200:
   *         description: Stock information
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/StockResponse'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Stock not found
   */
router.get("/:productId", requirePermission('inventory:read'), stockController.getStock.bind(stockController)); // Get stock for a product at a location


/**
   * @swagger
   * /stock/adjust:
   *   post:
   *     summary: Adjust stock to a specific quantity
   *     tags: [Stock]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AdjustStockDto'
   *     responses:
   *       200:
   *         description: Updated stock information
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/StockResponse'
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   */
router.post("/adjust", 
    requirePermission('inventory:adjust'),
     stockController.adjustStockLevel.bind(stockController
     )); // Set absolute quantity

     /**
   * @swagger
   * /stock/increment:
   *   post:
   *     summary: Increment or decrement stock quantity
   *     tags: [Stock]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/IncrementStockDto'
   *     responses:
   *       200:
   *         description: Updated stock information
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/StockResponse'
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   */
router.post("/increment",
    requirePermission('inventory:adjust'),
     stockController.incrementStockLevel.bind(stockController)
    ); // Add/subtract quantity


     /**
   * @swagger
   * /stock/{productId}:
   *   delete:
   *     summary: Delete a stock record
   *     tags: [Stock]
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
   *         name: productId
   *         schema:
   *           type: string
   *         required: true
   *         description: Product ID
   *       - in: query
   *         name: storeId
   *         schema:
   *           type: string
   *         description: Store ID
   *       - in: query
   *         name: warehouseId
   *         schema:
   *           type: string
   *         description: Warehouse ID
   *     responses:
   *       204:
   *         description: Stock record deleted
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Stock not found
   */
router.delete("/:productId",
    requirePermission('inventory:delete'),
    stockController.deleteStock.bind(stockController)
); // Delete stock record

export default router;
