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
 *   name: PurchaseOrder
 *   description: Purchase order management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PurchaseOrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         productId:
 *           type: string
 *         productName:
 *           type: string
 *         productSku:
 *           type: string
 *         quantity:
 *           type: number
 *         costPrice:
 *           type: number
 *         batchNumber:
 *           type: string
 *         expiryDate:
 *           type: string
 *           format: date-time
 *         isControlled:
 *           type: boolean
 * 
 *     PurchaseOrderPayment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         amount:
 *           type: number
 *         method:
 *           type: string
 *         status:
 *           type: string
 *         paidAt:
 *           type: string
 *           format: date-time
 * 
 *     PurchaseOrder:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         tenantId:
 *           type: string
 *         supplier:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         store:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         warehouse:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         orderDate:
 *           type: string
 *           format: date-time
 *         receivedDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [pending, approved, received, cancelled]
 *         totalAmount:
 *           type: number
 *         paidAmount:
 *           type: number
 *         balance:
 *           type: number
 *         notes:
 *           type: string
 *           nullable: true
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PurchaseOrderItem'
 *         payments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PurchaseOrderPayment'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     CreatePurchaseOrderItem:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *         - costPrice
 *       properties:
 *         productId:
 *           type: string
 *         quantity:
 *           type: number
 *         costPrice:
 *           type: number
 *         batchNumber:
 *           type: string
 *         expiryDate:
 *           type: string
 *           format: date-time
 * 
 *     CreatePurchaseOrder:
 *       type: object
 *       required:
 *         - tenantId
 *         - supplierId
 *         - orderDate
 *         - items
 *         - totalAmount
 *       properties:
 *         tenantId:
 *           type: string
 *         supplierId:
 *           type: string
 *         storeId:
 *           type: string
 *         warehouseId:
 *           type: string
 *         orderDate:
 *           type: string
 *           format: date-time
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CreatePurchaseOrderItem'
 *         totalAmount:
 *           type: number
 *         notes:
 *           type: string
 * 
 *     UpdatePurchaseOrder:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, approved, received, cancelled]
 *         receivedDate:
 *           type: string
 *           format: date-time
 *         notes:
 *           type: string
 * 
 *     CancelPurchaseOrder:
 *       type: object
 *       required:
 *         - cancelledBy
 *       properties:
 *         cancelledBy:
 *           type: string
 *         reason:
 *           type: string
 * 
 *     LinkPayment:
 *       type: object
 *       required:
 *         - paymentId
 *         - amount
 *       properties:
 *         paymentId:
 *           type: string
 *         amount:
 *           type: number
 * 
 *     PaginatedPurchaseOrders:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PurchaseOrder'
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
 * /purchase-orders:
 *   post:
 *     summary: Create a new purchase order
 *     tags: [PurchaseOrder]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePurchaseOrder'
 *     responses:
 *       201:
 *         description: Purchase order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseOrder'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 */
router.post(
  "/",
  requirePermission('purchaseOrder:create'),
  purchaseOrderController.createPurchaseOrder.bind(purchaseOrderController)
);

/**
 * @swagger
 * /purchase-orders/controlled:
 *   post:
 *     summary: Create a controlled substance purchase order (additional validations)
 *     tags: [PurchaseOrder]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePurchaseOrder'
 *     responses:
 *       201:
 *         description: Controlled substance purchase order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseOrder'
 *       400:
 *         description: Validation error or missing required fields for controlled substances
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 */
router.post(
  "/controlled",
  requirePermission('purchaseOrder:create'),
  purchaseOrderController.createControlledSubstanceOrder.bind(purchaseOrderController)
);

/**
 * @swagger
 * /purchase-orders/{id}:
 *   put:
 *     summary: Update a purchase order
 *     tags: [PurchaseOrder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Purchase order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePurchaseOrder'
 *     responses:
 *       200:
 *         description: Purchase order updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseOrder'
 *       400:
 *         description: Validation error or cannot update received/cancelled PO
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 *       404:
 *         description: Purchase order not found
 */
router.put(
  "/:id",
  requirePermission('purchaseOrder:update'),
  purchaseOrderController.updatePurchaseOrder.bind(purchaseOrderController)
);

/**
 * @swagger
 * /purchase-orders/{id}/cancel:
 *   post:
 *     summary: Cancel a purchase order
 *     tags: [PurchaseOrder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Purchase order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CancelPurchaseOrder'
 *     responses:
 *       200:
 *         description: Purchase order cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseOrder'
 *       400:
 *         description: Validation error or cannot cancel received PO
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 *       404:
 *         description: Purchase order not found
 */
router.post(
  "/:id/cancel",
  requirePermission('purchaseOrder:cancel'),
  purchaseOrderController.cancelPurchaseOrder.bind(purchaseOrderController)
);

/**
 * @swagger
 * /purchase-orders/{id}/receive:
 *   post:
 *     summary: Receive a purchase order (update inventory/stock)
 *     tags: [PurchaseOrder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Purchase order ID
 *     responses:
 *       200:
 *         description: Purchase order received and inventory updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseOrder'
 *       400:
 *         description: Validation error or PO already received/cancelled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 *       404:
 *         description: Purchase order not found
 */
router.post(
  "/:id/receive",
  requirePermission('purchaseOrder:receive'),
  purchaseOrderController.receivePurchaseOrder.bind(purchaseOrderController)
);

/**
 * @swagger
 * /purchase-orders/{id}/link-payment:
 *   post:
 *     summary: Link a payment to a purchase order
 *     tags: [PurchaseOrder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Purchase order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LinkPayment'
 *     responses:
 *       200:
 *         description: Payment linked to purchase order
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseOrder'
 *       400:
 *         description: Validation error or payment already linked
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 *       404:
 *         description: Purchase order or payment not found
 */
router.post(
  "/:id/link-payment",
  requirePermission('purchaseOrder:payment'),
  purchaseOrderController.linkPayment.bind(purchaseOrderController)
);

/**
 * @swagger
 * /purchase-orders:
 *   get:
 *     summary: List purchase orders with filtering
 *     tags: [PurchaseOrder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: supplierId
 *         schema:
 *           type: string
 *         description: Filter by supplier ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, received, cancelled]
 *         description: Filter by status
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
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter by product ID (included in any item)
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date (order date)
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date (order date)
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
 *         description: List of purchase orders
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedPurchaseOrders'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 */
router.get(
  "/",
  requirePermission('purchaseOrder:read'),
  purchaseOrderController.listPurchaseOrders.bind(purchaseOrderController)
);

/**
 * @swagger
 * /purchase-orders/pending:
 *   get:
 *     summary: List pending purchase orders
 *     tags: [PurchaseOrder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: supplierId
 *         schema:
 *           type: string
 *         description: Filter by supplier ID
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
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter by product ID (included in any item)
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date (order date)
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date (order date)
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
 *         description: List of pending purchase orders
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedPurchaseOrders'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 */
router.get(
  "/pending",
  requirePermission('purchaseOrder:read'),
  purchaseOrderController.listPendingOrders.bind(purchaseOrderController)
);

/**
 * @swagger
 * /purchase-orders/{id}:
 *   get:
 *     summary: Get a purchase order by ID
 *     tags: [PurchaseOrder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Purchase order ID
 *     responses:
 *       200:
 *         description: Purchase order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseOrder'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 *       404:
 *         description: Purchase order not found
 */
router.get(
  "/:id",
  requirePermission('purchaseOrder:read'),
  purchaseOrderController.getPurchaseOrderById.bind(purchaseOrderController)
);

export default router;