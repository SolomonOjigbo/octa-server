import { Router } from "express";
import { transactionController } from "../controllers/transaction.controller";

const router = Router();

router.get("/", transactionController.getTransactions.bind(transactionController));
router.get("/:id", transactionController.getTransactionById.bind(transactionController));
router.put("/:id/status", transactionController.updateTransactionStatus.bind(transactionController));

export default router;
