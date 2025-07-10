import { Router } from 'express';
import { reportingController } from '../controllers/reporting.controller';
import { requireAuth } from '@middleware/requireAuth';
import { requirePermission } from '@middleware/requirePermission';

const router = Router();
router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   - name: Reporting
 *     description: Aggregate, dashboard & summary endpoints
 */

/**
 * @swagger
 * /reports/sales:
 *   get:
 *     tags: [Reporting]
 *     summary: Sales summary over time
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema: { type: string, format: date }
 *       - name: endDate
 *         in: query
 *         schema: { type: string, format: date }
 *       - name: groupBy
 *         in: query
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *     responses:
 *       200:
 *         description: Array of sales buckets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SalesBucket'
 */
router.get(
  '/sales',
  requirePermission('reporting:sales'),
  reportingController.salesSummary
);

/**
 * @swagger
 * /reports/inventory:
 *   get:
 *     tags: [Reporting]
 *     summary: Current inventory status
 *     parameters:
 *       - name: belowReorder
 *         in: query
 *         schema: { type: boolean }
 *         description: Only show items at or below reorder point
 *     responses:
 *       200:
 *         description: Inventory status array
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InventoryStatus'
 */
router.get(
  '/inventory',
  requirePermission('reporting:inventory'),
  reportingController.inventoryStatus
);

/**
 * @swagger
 * /reports/purchase-orders:
 *   get:
 *     tags: [Reporting]
 *     summary: Purchase order counts by status
 *     responses:
 *       200:
 *         description: PO status counts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/POStatusCount'
 */
router.get(
  '/purchase-orders',
  requirePermission('reporting:purchaseOrders'),
  reportingController.purchaseOrderStatus
);

/**
 * @swagger
 * /reports/transactions:
 *   get:
 *     tags: [Reporting]
 *     summary: Transaction totals by type
 *     responses:
 *       200:
 *         description: Transaction type aggregates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TransactionTypeCount'
 */
router.get(
  '/transactions',
  requirePermission('reporting:transactions'),
  reportingController.transactionTypes
);

/**
 * @swagger
 * /reports/payments:
 *   get:
 *     tags: [Reporting]
 *     summary: Payment totals by method
 *     responses:
 *       200:
 *         description: Payment method aggregates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PaymentMethodCount'
 */
router.get(
  '/payments',
  requirePermission('reporting:payments'),
  reportingController.paymentMethods
);

/**
 * @swagger
 * /reports/b2b-connections:
 *   get:
 *     tags: [Reporting]
 *     summary: B2B connections count by status
 *     responses:
 *       200:
 *         description: B2B status counts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/B2BStatusCount'
 */
router.get(
  '/b2b-connections',
  requirePermission('reporting:b2bConnections'),
  reportingController.b2bConnections
);

export default router;
