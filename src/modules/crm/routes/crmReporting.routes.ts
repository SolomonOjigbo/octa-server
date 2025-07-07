import { Router } from "express";
import { crmReportingController } from "../controllers/crmReporting.controller";
import { requirePermission } from "@middleware/requirePermission";
import { requireAuth } from "@middleware/requireAuth";

const router = Router();

router.use(requireAuth);


// Reporting
/**
 * @swagger
 * tags:
 *   - name: CRMReports
 *     description: Customer reporting endpoints
 */

/**
 * @swagger
 * /crm/reports/{customerId}/summary:
 *   get:
 *     tags: [CRMReports]
 *     summary: Get summary report for a customer
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerSummary'
 */
router.get(
  '/reports/:customerId/summary',
  requirePermission('crm:report:view'),
  crmReportingController.getCustomerSummaryReport
);

/**
 * @swagger
 * /crm/reports/top-customers:
 *   get:
 *     tags: [CRMReports]
 *     summary: Get top N customers by spend
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Top customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TopCustomer'
 */
router.get(
  '/reports/top-customers',
  requirePermission('crm:report:view'),
  crmReportingController.getTopCustomers
);

/**
 * @swagger
 * /crm/reports/{customerId}/frequency:
 *   get:
 *     tags: [CRMReports]
 *     summary: Get average purchase frequency for a customer
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase frequency
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseFrequencyResponse'
 */
router.get(
  '/reports/:customerId/frequency',
  requirePermission('crm:report:view'),
  crmReportingController.getCustomerPurchaseFrequency
);

/**
 * @swagger
 * /crm/reports/outstanding:
 *   get:
 *     tags: [CRMReports]
 *     summary: Get customers with outstanding balances
 *     responses:
 *       200:
 *         description: Outstanding customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OutstandingCustomer'
 */
router.get(
  '/reports/outstanding',
  requirePermission('crm:report:view'),
  crmReportingController.getCustomersWithOutstanding
);

export default router;
