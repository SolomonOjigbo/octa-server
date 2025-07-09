// modules/stockTransfer/routes/stockTransfer.routes.ts
import { Router } from "express";
import { stockTransferController } from "../controllers/stockTransfer.controller";
import { requirePermission } from "@middleware/requirePermission";
import { requireAuth } from "@middleware/requireAuth";



const router = Router();
router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   - name: StockTransfers
 *     description: Inter-tenant stock transfer workflow
 */

/**
 * @swagger
 * /stock-transfers:
 *   get:
 *     tags: [StockTransfers]
 *     summary: List all stock transfers for current tenant
 *     security: [bearerAuth: []]
 *     responses:
 *       200:
 *         description: Array of stock transfer records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StockTransferResponseDto'
 */
router.get(
  '/',
  requirePermission('stockTransfer:read'),
  stockTransferController.list
);

/**
 * @swagger
 * /stock-transfers/{id}:
 *   get:
 *     tags: [StockTransfers]
 *     summary: Get a single stock transfer
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Stock transfer record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StockTransferResponseDto'
 */
router.get(
  '/:id',
  requirePermission('stockTransfer:read'),
  stockTransferController.getById
);

/**
 * @swagger
 * /stock-transfers/request:
 *   post:
 *     tags: [StockTransfers]
 *     summary: Request a new stock transfer
 *     security: [bearerAuth: []]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStockTransferDto'
 *     responses:
 *       201:
 *         description: Transfer requested
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StockTransferResponseDto'
 */
router.post(
  '/request',
  requirePermission('stockTransfer:create'),
  stockTransferController.requestTransfer
);

/**
 * @swagger
 * /stock-transfers/{id}/approve:
 *   patch:
 *     tags: [StockTransfers]
 *     summary: Approve a pending stock transfer
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApproveStockTransferDto'
 *     responses:
 *       200:
 *         description: Approved transfer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StockTransferResponseDto'
 */
router.patch(
  '/:id/approve',
  requirePermission('stockTransfer:update'),
  stockTransferController.approve
);

/**
 * @swagger
 * /stock-transfers/{id}/reject:
 *   patch:
 *     tags: [StockTransfers]
 *     summary: Reject a pending stock transfer
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RejectStockTransferDto'
 *     responses:
 *       200:
 *         description: Rejected transfer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StockTransferResponseDto'
 */
router.patch(
  '/:id/reject',
  requirePermission('stockTransfer:update'),
  stockTransferController.reject
);

/**
 * @swagger
 * /stock-transfers/{id}/cancel:
 *   patch:
 *     tags: [StockTransfers]
 *     summary: Cancel or revoke a stock transfer
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CancelStockTransferDto'
 *     responses:
 *       200:
 *         description: Cancelled transfer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StockTransferResponseDto'
 */
router.patch(
  '/:id/cancel',
  requirePermission('stockTransfer:update'),
  stockTransferController.cancel
);

export default router;
