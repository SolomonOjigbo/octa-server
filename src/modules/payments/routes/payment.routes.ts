import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { requireAuth } from "@middleware/requireAuth";
import { requirePermission } from "@middleware/requirePermission";


const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: Manage payments across modules (PO, POS, etc.)
 */

/**
 * @swagger
 * /payments:
 *   get:
 *     tags: [Payments]
 *     summary: List all payments for current tenant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: transactionId
 *         schema:
 *           type: string
 *       - in: query
 *         name: purchaseOrderId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PaymentResponseDto'
 */
router.get(
  '/',
  requirePermission('payment:read'),
  paymentController.list
);

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     tags: [Payments]
 *     summary: Get a single payment by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponseDto'
 */
router.get(
  '/:id',
  requirePermission('payment:read'),
  paymentController.getById
);

/**
 * @swagger
 * /payments:
 *   post:
 *     tags: [Payments]
 *     summary: Create a new payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePaymentDto'
 *     responses:
 *       201:
 *         description: Payment created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponseDto'
 */
router.post(
  '/',
  requirePermission('payment:create'),
  paymentController.create
);

/**
 * @swagger
 * /payments/{id}:
 *   patch:
 *     tags: [Payments]
 *     summary: Update a payment record
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
 *             $ref: '#/components/schemas/UpdatePaymentDto'
 *     responses:
 *       200:
 *         description: Payment updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponseDto'
 */
router.patch(
  '/:id',
  requirePermission('payment:update'),
  paymentController.update
);

/**
 * @swagger
 * /payments/{id}/refund:
 *   patch:
 *     summary: Refund a completed payment (partial or full)
 *     description: Process a refund for an existing payment
 *     tags: [Payments, Refunds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: ID of the payment to refund
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefundPaymentDto'
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponseDto'
 *       400:
 *         description: Invalid refund request
 *       404:
 *         description: Original payment not found
 */

router.patch('/:id/refund',
  requirePermission('payment:refund'),
  paymentController.refund
);

/**
 * @swagger
 * /payments/{id}/reverse:
 *   patch:
 *     summary: Reverse a payment
 *     description: Reverse a payment transaction
 *     tags: [Payments, Reverse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: ID of the payment to reverse
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReversePaymentDto'
 *     responses:
 *       200:
 *         description: Payment reversed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponseDto'
 *       400:
 *         description: Payment already reversed or invalid request
 *       404:
 *         description: Payment not found
 */

router.patch('/:id/reverse',
  requirePermission('payment:reverse'),
  paymentController.reverse
);

/**
 * @swagger
 * /payments/{id}:
 *   delete:
 *     tags: [Payments]
 *     summary: Delete a payment record
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
  requirePermission('payment:delete'),
  paymentController.delete
);

export default router;