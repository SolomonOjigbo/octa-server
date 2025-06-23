import { Router } from "express";
import { stockTransferController } from "../controllers/stockTransfer.controller";

const router = Router();

router.post("/", stockTransferController.createTransfer.bind(stockTransferController));
router.post("/:transferId/approve", stockTransferController.approveTransfer.bind(stockTransferController));
router.post("/:transferId/reject", stockTransferController.rejectTransfer.bind(stockTransferController));
router.post("/:transferId/cancel", stockTransferController.cancelTransfer.bind(stockTransferController));
router.get("/", stockTransferController.listTransfers.bind(stockTransferController));
router.get("/:transferId", stockTransferController.getTransferById.bind(stockTransferController));
router.delete("/:transferId", stockTransferController.deleteTransfer.bind(stockTransferController));

export default router;
