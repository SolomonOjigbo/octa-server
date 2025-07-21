// routes/reconciliation.routes.ts
import { Router } from 'express';
import { reconciliationController } from '../controllers/reconciliation.controller';

const router = Router();

/**
 * @swagger
 * /reconciliation/invoice/{invoiceId}:
 *   post:
 *     summary: Manually reconcile invoice
 */
router.post('/invoice/:invoiceId', reconciliationController.reconcileInvoice);

/**
 * @swagger
 * /reconciliation/payment/{paymentId}:
 *   post:
 *     summary: Manually reconcile payment
 */
router.post('/payment/:paymentId', reconciliationController.reconcilePayment);

/**
 * @swagger
 * /reconciliation/stock-transfer/{stockTransferId}:
 *   post:
 *     summary: Manually reconcile stock transfer
 */
router.post('/stock-transfer/:stockTransferId', reconciliationController.reconcileStockTransfer);

/**
 * @swagger
 * /reconciliation/transaction/{transactionId}:
 *   post:
 *     summary: Manually reconcile transaction to inventory
 */
router.post('/transaction/:transactionId', reconciliationController.reconcileTransaction);

export default router;
