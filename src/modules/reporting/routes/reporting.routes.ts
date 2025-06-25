import { Router } from "express";
import { reportingController } from "../controllers/reporting.controller";

const router = Router();
router.get("/sales-summary", reportingController.getSalesSummary.bind(reportingController));
router.get("/daily-sales", reportingController.getDailySales.bind(reportingController));
export default router;
