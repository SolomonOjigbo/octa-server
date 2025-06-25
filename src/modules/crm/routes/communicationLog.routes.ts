import { Router } from "express";
import { communicationLogController } from "../controllers/communicationLog.controller";

const router = Router();
router.post("/", communicationLogController.createLog.bind(communicationLogController));
router.get("/customer/:customerId", communicationLogController.getLogsForCustomer.bind(communicationLogController));
router.get("/supplier/:supplierId", communicationLogController.getLogsForSupplier.bind(communicationLogController));
router.get("/user/:userId", communicationLogController.getLogsForUser.bind(communicationLogController));
export default router;
