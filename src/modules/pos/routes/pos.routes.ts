// POS Session endpoints
// src/modules/pos/pos.routes.ts
import { Router } from "express";
import { posController } from "../controllers/pos.controller";
import { requirePermission } from "@middleware/requirePermission";
import { requireAuth } from "@middleware/requireAuth";


const router = Router();
router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   - name: POS
 *     description: Point‐of‐sale operations
 */

/**
 * @swagger
 * /pos/sessions:
 *   post:
 *     tags: [POS]
 *     summary: Open a new POS session
 *     security: [bearerAuth: []]
 *     responses:
 *       201:
 *         description: Session opened
 */
router.post(
  '/sessions',
  requirePermission('pos:session:create'),
  posController.openSession
);

/**
 * @swagger
 * /pos/sessions/{id}/close:
 *   patch:
 *     tags: [POS]
 *     summary: Close an open session
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CloseSessionDto'
 *     responses:
 *       200:
 *         description: Session closed
 */
router.patch(
  '/sessions/:id/close',
  requirePermission('pos:session:update'),
  posController.closeSession
);

/**
 * @swagger
 * /pos/sessions/{sessionId}/summary:
 *   get:
 *     tags: [POS]
 *     summary: Get session summary
 *     parameters:
 *       - name: sessionId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Summary data
 */
router.get(
  '/sessions/:sessionId/summary',
  requirePermission('pos:session:read'),
  posController.getSessionSummary
);

/**
 * @swagger
 * /pos/transactions:
 *   post:
 *     tags: [POS]
 *     summary: Create a new sale transaction
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTransactionDto'
 *     responses:
 *       201:
 *         description: Transaction created
 */
router.post(
  '/transactions',
  requirePermission('pos:transaction:create'),
  posController.createTransaction
);

/**
 * @swagger
 * /pos/payments:
 *   post:
 *     tags: [POS]
 *     summary: Record a payment for a transaction
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePaymentDto'
 *     responses:
 *       201:
 *         description: Payment recorded
 */
router.post(
  '/payments',
  requirePermission('pos:payment:create'),
  posController.createPayment
);

/**
 * @swagger
 * /pos/sales-returns:
 *   post:
 *     tags: [POS]
 *     summary: Record a sales return
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSalesReturnDto'
 *     responses:
 *       201:
 *         description: Sales return recorded
 */
router.post(
  '/sales-returns',
  requirePermission('pos:return:create'),
  posController.createSalesReturn
);

/**
 * @swagger
 * /pos/cash-drops:
 *   post:
 *     tags: [POS]
 *     summary: Create a cash drop
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCashDropDto'
 *     responses:
 *       201:
 *         description: Cash dropped
 */
router.post(
  '/cash-drops',
  requirePermission('pos:cashdrop:create'),
  posController.createCashDrop
);

/**
 * @swagger
 * /pos/reconcile-cash:
 *   post:
 *     tags: [POS]
 *     summary: Reconcile cash at session end
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReconcileCashDto'
 *     responses:
 *       201:
 *         description: Cash reconciled
 */
router.post(
  '/reconcile-cash',
  requirePermission('pos:reconcile:create'),
  posController.reconcileCash
);

export default router;