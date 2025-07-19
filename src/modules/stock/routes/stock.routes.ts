// src/modules/stock/routes.ts
import { Router } from 'express';
import { stockController } from '../controllers/stock.controller';
import { requireAuth } from '@middleware/requireAuth';
import { requirePermission } from '@middleware/requirePermission';


const router = Router();
router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   - name: Stock
 *     description: Stock level management and adjustments
 */

/**
 * @swagger
 * /stock:
 *   get:
 *     tags: [Stock]
 *     summary: Retrieve all stock levels for the current tenant
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of stock level records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StockLevelDto'
 */
router.get(
  '/',
  requirePermission('stock:read'),
  stockController.getStockLevels
);

/**
 * @swagger
 * /stock/adjust:
 *   post:
 *     tags: [Stock]
 *     summary: Create a stock adjustment record
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdjustStockDto'
 *     responses:
 *       201:
 *         description: Stock adjustment created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stock'
 */
router.post(
  '/adjust-product:id',
  requirePermission('stock:adjust'),
  stockController.adjustProductStock
);

/**
 * @swagger
 * /stock/increment:
 *   post:
 *     tags: [Stock]
 *     summary: Increment or upsert stock quantity
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
 *         description: Stock quantity updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stock'
 */
router.post(
  '/adjust-variant:id',
  requirePermission('stock:adjust'),
  stockController.adjustVariantStock
);

/**
 * @swagger
 * /stock/{id}:
 *   delete:
 *     tags: [Stock]
 *     summary: Delete a stock record
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Stock record deleted (no content)
 */
router.delete(
  '/:id',
  requirePermission('stock:delete'),
  stockController.deleteStock
);

export default router;
