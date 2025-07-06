import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { requireAuth } from "@middleware/requireAuth";
import { requirePermission } from "@middleware/requirePermission";


const router = Router();

// Secure all payment routes
router.use(requireAuth);

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
router.post("/", requirePermission('payment:create'), paymentController.createPayment.bind(paymentController));

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
router.get("/", requirePermission('payment:read'), paymentController.getPayments.bind(paymentController));

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
router.post("/refund", requirePermission('payment:refund'), paymentController.createRefund.bind(paymentController));

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
router.post("/:id/reverse", requirePermission('payment:reverse'), paymentController.reversePayment.bind(paymentController));


export default router;