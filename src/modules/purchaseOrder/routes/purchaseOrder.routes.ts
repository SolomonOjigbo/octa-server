import { Router } from "express";
import { purchaseOrderController } from "../controllers/purchaseOrder.controller";

const router = Router();

router.post("/", purchaseOrderController.createPurchaseOrder.bind(purchaseOrderController));
router.put("/:id", purchaseOrderController.updatePurchaseOrder.bind(purchaseOrderController));
router.post("/:id/cancel", purchaseOrderController.cancelPurchaseOrder.bind(purchaseOrderController));
router.post("/:id/receive", purchaseOrderController.receivePurchaseOrder.bind(purchaseOrderController));
router.post("/:id/link-payment", purchaseOrderController.linkPayment.bind(purchaseOrderController));
router.get("/", purchaseOrderController.getPurchaseOrders.bind(purchaseOrderController));
router.get("/:id", purchaseOrderController.getPurchaseOrderById.bind(purchaseOrderController));

export default router;
