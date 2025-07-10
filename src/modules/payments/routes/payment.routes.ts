import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { requireAuth } from "@middleware/requireAuth";
import { requirePermission } from "@middleware/requirePermission";


const router = Router();

// Secure all payment routes
router.use(requireAuth);


// V1 Routes

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
 * @openapi
 * 
 * /payments/{id}:
 * patch:
 * summary: Refund a completed payment (partial or full)
 * tags: [Payments, Refunds]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema: { type: string, format: cuid }
 * 
 * 
 */

router.patch('/:id/refund',
  requirePermission('payment:refund'),
  paymentController.refund
);


/**
 * @openapi
 * 
 * /payments/{id}:
 * patch:
 * summary: Reverse a payment 
 * tags: [Payments, Reverse]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema: { type: string, format: cuid }
 * 
 * 
 * 
 * 
 */

router.patch('/:id/reverse',
  requirePermission('payment:reverse'),
  paymentController.reverse
);


export default router;

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





//V2 Routes

/**
 * @openapi
 * /payments:
 * post:
 * summary: Create a new payment
 * tags: [Payments]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/CreatePaymentDto'
 * responses:
 * 201:
 * description: Payment created successfully.
 * 400:
 * description: Invalid input or failed business logic.
 */
// router.post("/", requirePermission('payment:create'), paymentController.createPayment.bind(paymentController));

/**
 * @openapi
 * /payments:
 * get:
 * summary: Retrieve a list of payments
 * tags: [Payments]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: query
 * name: transactionId
 * schema: { type: string }
 * - in: query
 * name: purchaseOrderId
 * schema: { type: string }
 * responses:
 * 200:
 * description: A list of payments.
 */
// router.get("/", requirePermission('payment:read'), paymentController.getPayments.bind(paymentController));

/**
 * @openapi
 * /payments/refund:
 * post:
 * summary: Create a refund for a payment
 * tags: [Payments]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/CreateRefundDto'
 * responses:
 * 201:
 * description: Refund processed successfully.
 * 400:
 * description: Invalid refund request.
 * 404:
 * description: Original payment not found.
 */
// router.post("/refund", requirePermission('payment:refund'), paymentController.createRefund.bind(paymentController));

/**
 * @openapi
 * /payments/{id}/reverse:
 * post:
 * summary: Reverse a specific payment
 * tags: [Payments]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema: { type: string, format: cuid }
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * reason: { type: string }
 * responses:
 * 200:
 * description: Payment reversed successfully.
 * 400:
 * description: Payment already reversed or invalid request.
 * 404:
 * description: Payment not found.
 */
// router.post("/:id/reverse", requirePermission('payment:reverse'), paymentController.reversePayment.bind(paymentController));