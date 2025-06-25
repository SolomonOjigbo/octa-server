import { Router } from "express";
import { crmReportingController } from "../controllers/crmReporting.controller";

const router = Router();
router.get("/top-customers", crmReportingController.getTopCustomers.bind(crmReportingController));
router.get("/customer/:customerId/purchase-frequency", crmReportingController.getCustomerPurchaseFrequency.bind(crmReportingController));
router.get("/outstanding-balances", crmReportingController.getCustomersWithOutstanding.bind(crmReportingController));
export default router;
