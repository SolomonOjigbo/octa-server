import { Router } from "express";
import { posController } from "../controllers/pos.controller";
import { requirePermission } from "@middleware/requirePermission";
import { requireAuth } from "@middleware/requireAuth";

const router = Router();

// POS Session endpoints
/**
   * @swagger
   * /pos/sessions/open:
   * post:
   * summary: Open a new POS session
   * tags: [POS Sessions]
   * requestBody:
   * required: true
   * content:
   * application/json:
   * schema:
   * $ref: '#/components/schemas/OpenPOSSessionDto'
   * responses:
   * 201:
   * description: Session opened successfully.
   * 400:
   * description: Invalid input data.
   * 409:
   * description: User already has an open session.
   */
// Permissions: pos:session:open
router.post("/sessions/open", requirePermission('pos:session:open'), posController.openSession.bind(posController));
// Permissions: pos:session:close

/**
   * @swagger
   * /pos/sessions/close:
   * post:
   * summary: Close an existing POS session
   * tags: [POS Sessions]
   * requestBody:
   * required: true
   * content:
   * application/json:
   * schema:
   * $ref: '#/components/schemas/ClosePOSSessionDto'
   * responses:
   * 200:
   * description: Session closed successfully.
   * 400:
   * description: Session is already closed or invalid data.
   * 404:
   * description: Session not found.
   */
// Permissions: pos:session:close
router.post("/sessions/close", requirePermission('pos:session:close'), posController.closeSession.bind(posController));


/**
   * @swagger
   * /pos/sessions:
   * get:
   * summary: Get all POS sessions for a tenant
   * tags: [POS Sessions]
   * parameters:
   * - in: query
   * name: tenantId
   * required: true
   * schema:
   * type: string
   * - in: query
   * name: storeId
   * schema:
   * type: string
   * responses:
   * 200:
   * description: List of POS sessions.
   */
// Permissions: pos:session:read
router.get("/sessions", requirePermission('pos:session:read'), posController.getSessions.bind(posController));

/**
   * @swagger
   * /pos/sessions/open:
   * get:
   * summary: Get the currently open POS session for a user
   * tags: [POS Sessions]
   * parameters:
   * - in: query
   * name: tenantId
   * required: true
   * schema:
   * type: string
   * - in: query
   * name: storeId
   * required: true
   * schema:
   * type: string
   * - in: query
   * name: userId
   * required: true
   * schema:
   * type: string
   * responses:
   * 200:
   * description: Open session details.
   */
// Permissions: pos:session:read
router.get("/sessions/open", requirePermission('pos:session:read'), posController.getOpenSession.bind(posController));

// Transactions
/**
   * @swagger
   * /pos/transactions:
   * post:
   * summary: Create a new POS transaction
   * tags: [POS Transactions]
   * requestBody:
   * required: true
   * content:
   * application/json:
   * schema:
   * $ref: '#/components/schemas/CreatePOSTransactionDto'
   * responses:
   * 201:
   * description: Transaction created successfully.
   * 400:
   * description: Invalid data, insufficient stock, or closed session.
   */
// Permissions: pos:transaction:create
router.post("/transactions", requirePermission('pos:transaction:create'), posController.createTransaction.bind(posController));

/**
   * @swagger
   * /pos/transactions:
   * get:
   * summary: Get POS transactions
   * tags: [POS Transactions]
   * parameters:
   * - in: query
   * name: tenantId
   * required: true
   * schema:
   * type: string
   * - in: query
   * name: storeId
   * schema:
   * type: string
   * - in: query
   * name: sessionId
   * schema:
   * type: string
   * responses:
   * 200:
   * description: List of transactions.
   */
// Permissions: pos:transaction:read
router.get("/transactions", requirePermission('pos:transaction:read'), posController.getTransactions.bind(posController));

// Payments
/**
   * @swagger
   * /pos/payments:
   * post:
   * summary: Create a new POS payment
   * tags: [POS Payments]
   * requestBody:
   * required: true
   * content:
   * application/json:
   * schema:
   * $ref: '#/components/schemas/CreatePOSPaymentDto'
   * responses:
   * 201:
   * description: Payment created successfully.
   * 400:
   * description: Invalid data or insufficient balance.
   */
// Permissions: pos:payment:create
router.post("/payments", requirePermission('pos:payment:create'), posController.createPayment.bind(posController));

/**
   * @swagger
   * /pos/payments:
   * get:
   * summary: Get POS payments
   * tags: [POS Payments]
   * parameters:
   * - in: query
   * name: tenantId
   * required: true
   * schema:
   * type: string
   * - in: query
   * name: transactionId
   * schema:
   * type: string
   * responses:
   * 200:
   * description: List of payments.
   */
// Permissions: pos:payment:read
router.get("/payments", requirePermission('pos:payment:read'), posController.getPayments.bind(posController));

// Sales Returns
/**
   * @swagger
   * /pos/sales-return:
   * post:
   * summary: Create a sales return transaction
   * tags: [POS Sales Returns]
   * requestBody:
   * required: true
   * content:
   * application/json:
   * schema:
   * $ref: '#/components/schemas/CreateSalesReturnDto'
   * responses:
   * 201:
   * description: Sales return created successfully.
   * 400:
   * description: Invalid data or insufficient stock.
   */
// Sales Return
// Permissions: pos:return:create
router.post("/sales-return", requirePermission('pos:return:create'), posController.createSalesReturn.bind(posController));


// Cash Drops
/**
   * @swagger
   * /pos/cash-drop:
   * post:
   * summary: Create a cash drop
   * tags: [POS Cash Drops]
   * requestBody:
   * required: true
   * content:
   * application/json:
   * schema:
   * $ref: '#/components/schemas/CreateCashDropDto'
   * responses:
   * 201:
   * description: Cash drop created successfully.
   * 400:
   * description: Invalid data or insufficient balance.
   */
// Cash Drop
// Permissions: pos:cashdrop:create
router.post("/cash-drop", requirePermission('pos:cashdrop:create'), posController.createCashDrop.bind(posController));


/**
   * @swagger
   * /pos/cash-drop:
   * get:
   * summary: Get cash drops for a session
   * tags: [POS Cash Drops]
   * parameters:
   * - in: query
   * name: tenantId
   * required: true
   * schema:
   * type: string
   * - in: query
   * name: sessionId
   * schema:
   * type: string
   * responses:
   * 200:
   * description: List of cash drops.
   */
// Receipt
// Permissions: pos:receipt:read
router.get("/receipt/:transactionId", requirePermission('pos:receipt:read'), posController.getReceipt.bind(posController));


//Automated POS Cash Reconciliation
/**
   * @swagger
   * /pos/sessions/{sessionId}/reconcile-cash:
   * post:
   * summary: Reconcile cash for a POS session
   * tags: [POS Sessions]
   * parameters:
   * - in: path
   * name: sessionId
   * required: true
   * schema:
   * type: string
   * requestBody:
   * required: true
   * content:
   * application/json:
   * schema:
   * $ref: '#/components/schemas/ReconcileCashDto'
   * responses:
   * 200:
   * description: Cash reconciled successfully.
   * 400:
   * description: Invalid data or session not found.
   */
// Automated POS Cash Reconciliation
// Permissions: pos:session:read
router.get("/sessions/:sessionId/payments-breakdown", requirePermission('pos:session:read'), posController.getSessionPaymentsBreakdown.bind(posController));

/**
   * @swagger
   * /pos/sessions/{sessionId}/reconcile-cash:
   * post:
   * summary: Perform a cash reconciliation for a closed session
   * tags: [POS Sessions]
   * parameters:
   * - in: path
   * name: sessionId
   * required: true
   * schema:
   * type: string
   * requestBody:
   * required: true
   * content:
   * application/json:
   * schema:
   * type: object
   * properties:
   * declaredClosingCash:
   * type: number
   * responses:
   * 200:
   * description: Reconciliation result.
   * 400:
   * description: Session is not closed or invalid data.
   * 404:
   * description: Session not found.
   */
// Permissions: pos:session:reconcile
router.post("/sessions/:sessionId/reconcile-cash", requirePermission('pos:session:reconcile'), posController.reconcileSessionCash.bind(posController));

/**
 * @swagger
 * /pos/sessions/{sessionId}/summary:
 * get:
 * summary: Get summary of a POS session
 * tags: [POS Sessions]
 * parameters:
 * -  in: path
 *    required: true
 *    schema:
 *      type: string
 *  responses:
 *      200:
 *      description: Summary data for session
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: true
 *               data:
 *                 $ref: '#/components/schemas/POSSessionSummary'
 *     404:
 *       description: POS session not found
 */

router.get(
  '/sessions/:sessionId/summary',
  requireAuth,
  requirePermission('pos:session:read'),
  posController.getSessionSummary
);




export default router;
