// modules/stockTransfer/routes/stockTransfer.routes.ts
import { Router } from "express";
import { stockTransferController } from "../controllers/stockTransfer.controller";
import { requirePermission } from "@middleware/requirePermission";
import { requireAuth } from "@middleware/requireAuth";

const router = Router();

// Middleware to ensure all routes require authentication
router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: StockTransfer
 *   description: Stock transfer management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     StockTransfer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The transfer ID
 *         tenantId:
 *           type: string
 *           description: The initiating tenant ID
 *         fromStore:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         fromWarehouse:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         toTenant:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         toStore:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         toWarehouse:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         product:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             sku:
 *               type: string
 *             isControlled:
 *               type: boolean
 *         quantity:
 *           type: number
 *           description: The quantity transferred
 *         transferType:
 *           type: string
 *           enum: [intra-tenant, cross-tenant]
 *         b2bConnection:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             status:
 *               type: string
 *         requestedBy:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         approvedBy:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         notes:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [pending, approved, completed, rejected, cancelled]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     CreateStockTransferDto:
 *       type: object
 *       required:
 *         - tenantId
 *         - productId
 *         - quantity
 *         - transferType
 *         - requestedBy
 *       properties:
 *         tenantId:
 *           type: string
 *         fromStoreId:
 *           type: string
 *         fromWarehouseId:
 *           type: string
 *         toTenantId:
 *           type: string
 *         toStoreId:
 *           type: string
 *         toWarehouseId:
 *           type: string
 *         productId:
 *           type: string
 *         quantity:
 *           type: number
 *         transferType:
 *           type: string
 *           enum: [intra-tenant, cross-tenant]
 *         b2bConnectionId:
 *           type: string
 *         requestedBy:
 *           type: string
 *         notes:
 *           type: string
 *         batchNumber:
 *           type: string
 *         expiryDate:
 *           type: string
 *           format: date-time
 * 
 *     ApproveStockTransferDto:
 *       type: object
 *       required:
 *         - approvedBy
 *       properties:
 *         approvedBy:
 *           type: string
 *         notes:
 *           type: string
 * 
 *     RejectStockTransferDto:
 *       type: object
 *       required:
 *         - rejectedBy
 *       properties:
 *         rejectedBy:
 *           type: string
 *         notes:
 *           type: string
 * 
 *     CancelStockTransferDto:
 *       type: object
 *       required:
 *         - cancelledBy
 *       properties:
 *         cancelledBy:
 *           type: string
 *         notes:
 *           type: string
 * 
 *     PaginatedStockTransfers:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/StockTransfer'
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *             page:
 *               type: number
 *             limit:
 *               type: number
 *             totalPages:
 *               type: number
 */

/**
 * @swagger
 * /stock-transfers:
 *   post:
 *     summary: Create a new stock transfer request
 *     tags: [StockTransfer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStockTransferDto'
 *     responses:
 *       201:
 *         description: Stock transfer created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/StockTransfer'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 */
router.post(
  "/",
  requirePermission('stockTransfer:create'),
  stockTransferController.createTransfer.bind(stockTransferController)
);

/**
 * @swagger
 * /stock-transfers/controlled:
 *   post:
 *     summary: Create a controlled substance transfer (additional validations)
 *     tags: [StockTransfer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStockTransferDto'
 *     responses:
 *       201:
 *         description: Controlled substance transfer created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/StockTransfer'
 *       400:
 *         description: Validation error or missing required fields for controlled substances
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 */
router.post(
  "/controlled",
  requirePermission('stockTransfer:create'),
  stockTransferController.createControlledSubstanceTransfer.bind(stockTransferController)
);

/**
 * @swagger
 * /stock-transfers/{transferId}/approve:
 *   post:
 *     summary: Approve a stock transfer
 *     tags: [StockTransfer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transferId
 *         schema:
 *           type: string
 *         required: true
 *         description: Stock transfer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApproveStockTransferDto'
 *     responses:
 *       200:
 *         description: Transfer approved and completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/StockTransfer'
 *       400:
 *         description: Validation error or transfer not pending
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 *       404:
 *         description: Transfer not found
 */
router.post(
  "/:transferId/approve",
  requirePermission('stockTransfer:approve'),
  stockTransferController.approveTransfer.bind(stockTransferController)
);

/**
 * @swagger
 * /stock-transfers/{transferId}/reject:
 *   post:
 *     summary: Reject a stock transfer
 *     tags: [StockTransfer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transferId
 *         schema:
 *           type: string
 *         required: true
 *         description: Stock transfer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RejectStockTransferDto'
 *     responses:
 *       200:
 *         description: Transfer rejected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/StockTransfer'
 *       400:
 *         description: Validation error or transfer not pending
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 *       404:
 *         description: Transfer not found
 */
router.post(
  "/:transferId/reject",
  requirePermission('stockTransfer:reject'),
  stockTransferController.rejectTransfer.bind(stockTransferController)
);

/**
 * @swagger
 * /stock-transfers/{transferId}/cancel:
 *   post:
 *     summary: Cancel a stock transfer
 *     tags: [StockTransfer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transferId
 *         schema:
 *           type: string
 *         required: true
 *         description: Stock transfer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CancelStockTransferDto'
 *     responses:
 *       200:
 *         description: Transfer cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/StockTransfer'
 *       400:
 *         description: Validation error or transfer not pending
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 *       404:
 *         description: Transfer not found
 */
router.post(
  "/:transferId/cancel",
  requirePermission('stockTransfer:cancel'),
  stockTransferController.cancelTransfer.bind(stockTransferController)
);

/**
 * @swagger
 * /stock-transfers:
 *   get:
 *     summary: List stock transfers with filtering
 *     tags: [StockTransfer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         description: Filter by initiating tenant ID
 *       - in: query
 *         name: toTenantId
 *         schema:
 *           type: string
 *         description: Filter by receiving tenant ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, completed, rejected, cancelled]
 *         description: Filter by transfer status
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Filter by store ID (either source or destination)
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *         description: Filter by warehouse ID (either source or destination)
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *       - in: query
 *         name: transferType
 *         schema:
 *           type: string
 *           enum: [intra-tenant, cross-tenant]
 *         description: Filter by transfer type
 *       - in: query
 *         name: requestedBy
 *         schema:
 *           type: string
 *         description: Filter by user who requested the transfer
 *       - in: query
 *         name: approvedBy
 *         schema:
 *           type: string
 *         description: Filter by user who approved/rejected the transfer
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
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
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of stock transfers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedStockTransfers'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 */
router.get(
  "/",
  requirePermission('stockTransfer:read'),
  stockTransferController.listTransfers.bind(stockTransferController)
);

/**
 * @swagger
 * /stock-transfers/pending:
 *   get:
 *     summary: List pending stock transfers
 *     tags: [StockTransfer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         description: Filter by initiating tenant ID
 *       - in: query
 *         name: toTenantId
 *         schema:
 *           type: string
 *         description: Filter by receiving tenant ID
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Filter by store ID (either source or destination)
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *         description: Filter by warehouse ID (either source or destination)
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *       - in: query
 *         name: transferType
 *         schema:
 *           type: string
 *           enum: [intra-tenant, cross-tenant]
 *         description: Filter by transfer type
 *       - in: query
 *         name: requestedBy
 *         schema:
 *           type: string
 *         description: Filter by user who requested the transfer
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
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
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of pending stock transfers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedStockTransfers'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 */
router.get(
  "/pending",
  requirePermission('stockTransfer:read'),
  stockTransferController.listPendingTransfers.bind(stockTransferController)
);

/**
 * @swagger
 * /stock-transfers/{transferId}:
 *   get:
 *     summary: Get a stock transfer by ID
 *     tags: [StockTransfer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transferId
 *         schema:
 *           type: string
 *         required: true
 *         description: Stock transfer ID
 *     responses:
 *       200:
 *         description: Stock transfer details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/StockTransfer'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 *       404:
 *         description: Transfer not found
 */
router.get(
  "/:transferId",
  requirePermission('stockTransfer:read'),
  stockTransferController.getTransferById.bind(stockTransferController)
);

/**
 * @swagger
 * /stock-transfers/{transferId}:
 *   delete:
 *     summary: Delete a stock transfer
 *     tags: [StockTransfer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transferId
 *         schema:
 *           type: string
 *         required: true
 *         description: Stock transfer ID
 *     responses:
 *       204:
 *         description: Transfer deleted
 *       400:
 *         description: Cannot delete completed transfer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 *       404:
 *         description: Transfer not found
 */
router.delete(
  "/:transferId",
  requirePermission('stockTransfer:delete'),
  stockTransferController.deleteTransfer.bind(stockTransferController)
);

export default router;