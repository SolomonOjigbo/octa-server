// modules/purchaseOrder/routes/purchaseOrder.routes.ts
import { Router } from "express";
import { purchaseOrderController } from "../controllers/purchaseOrder.controller";
import { requirePermission } from "@middleware/requirePermission";
import { requireAuth } from "@middleware/requireAuth";

const router = Router();

// Middleware to ensure all routes require authentication
router.use(requireAuth);


/**
 * @swagger
 * tags:
 *   - name: PurchaseOrders
 *     description: Create, update, receive and pay purchase orders
 */

/**
 * @swagger
 * /purchase-orders:
 *   get:
 *     tags: [PurchaseOrders]
 *     summary: List all purchase orders
 *     security: [bearerAuth: []]
 *     responses:
 *       200:
 *         description: Array of POs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PurchaseOrderResponseDto'
 */
router.get(
  '/',
  requirePermission('purchaseOrder:read'),
  purchaseOrderController.list
);

/**
 * @swagger
 * /purchase-orders/{id}:
 *   get:
 *     tags: [PurchaseOrders]
 *     summary: Get a single purchase order by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: One PO
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrderResponseDto'
 */
router.get(
  '/:id',
  requirePermission('purchaseOrder:read'),
  purchaseOrderController.getById
);

/**
 * @swagger
 * /purchase-orders:
 *   post:
 *     tags: [PurchaseOrders]
 *     summary: Create a new purchase order
 *     security: [bearerAuth: []]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePurchaseOrderDto'
 *     responses:
 *       201:
 *         description: PO created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrderResponseDto'
 */
router.post(
  '/',
  requirePermission('purchaseOrder:create'),
  purchaseOrderController.create
);

/**
 * @swagger
 * /purchase-orders/{id}:
 *   patch:
 *     tags: [PurchaseOrders]
 *     summary: Update a purchase order (status, notes, receivedDate)
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
 *             $ref: '#/components/schemas/UpdatePurchaseOrderDto'
 *     responses:
 *       200:
 *         description: PO updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrderResponseDto'
 */
router.patch(
  '/:id',
  requirePermission('purchaseOrder:update'),
  purchaseOrderController.update
);

/**
 * @swagger
 * /purchase-orders/{id}/cancel:
 *   patch:
 *     tags: [PurchaseOrders]
 *     summary: Cancel a purchase order
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CancelPurchaseOrderDto'
 *     responses:
 *       200:
 *         description: PO cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrderResponseDto'
 */
router.patch(
  '/:id/cancel',
  requirePermission('purchaseOrder:cancel'),
  purchaseOrderController.cancel
);

/**
 * @swagger
 * /purchase-orders/{id}/link-payment:
 *   post:
 *     tags: [PurchaseOrders]
 *     summary: Link a payment to a purchase order
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
 *             $ref: '#/components/schemas/LinkPaymentDto'
 *     responses:
 *       200:
 *         description: Payment linked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrderResponseDto'
 */
router.post(
  '/:id/link-payment',
  requirePermission('purchaseOrder:linkPayment'),
  purchaseOrderController.linkPayment
);

export default router;
