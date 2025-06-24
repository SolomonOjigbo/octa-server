import { Router } from "express";
import { posController } from "../controllers/pos.controller";

const router = Router();

// POS Session endpoints
router.post("/sessions/open", posController.openSession.bind(posController));
router.post("/sessions/close", posController.closeSession.bind(posController));
router.get("/sessions", posController.getSessions.bind(posController));
router.get("/sessions/open", posController.getOpenSession.bind(posController));

// Transactions
router.post("/transactions", posController.createTransaction.bind(posController));
router.get("/transactions", posController.getTransactions.bind(posController));

// Payments
router.post("/payments", posController.createPayment.bind(posController));
router.get("/payments", posController.getPayments.bind(posController));

router.post("/sales-return", posController.createSalesReturn.bind(posController));
router.post("/cash-drop", posController.createCashDrop.bind(posController));
router.get("/receipt/:transactionId", posController.getReceipt.bind(posController));

//Automated POS Cash Reconciliation
router.get("/sessions/:sessionId/payments-breakdown", posController.getSessionPaymentsBreakdown.bind(posController));
router.post("/sessions/:sessionId/reconcile-cash", posController.reconcileSessionCash.bind(posController));



export default router;
