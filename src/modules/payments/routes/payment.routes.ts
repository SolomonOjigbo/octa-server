import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";

const router = Router();

router.post("/", paymentController.createPayment.bind(paymentController));
router.get("/", paymentController.getPayments.bind(paymentController));
router.put("/:id", paymentController.updatePayment.bind(paymentController));
router.post("/refund", paymentController.createRefund.bind(paymentController));
router.post("/:id/reverse", paymentController.reversePayment.bind(paymentController));


export default router;
