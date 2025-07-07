import { Router } from "express";
import { communicationLogController } from "../controllers/communicationLog.controller";
import { requirePermission } from "@middleware/requirePermission";
import { requireAuth } from "@middleware/requireAuth";

const router = Router();

router.use(requireAuth);

// Communication Logs

/**
 * @swagger
 * tags:
 *   - name: CommunicationLogs
 *     description: CRM communication log endpoints
 */

/**
 * @swagger
 * /crm/logs:
 *   post:
 *     tags: [CommunicationLogs]
 *     summary: Create a new communication log entry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommunicationLogDto'
 *     responses:
 *       201:
 *         description: Created log
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommunicationLog'
 */
router.post(
  '/logs',
  requirePermission('crm:log:create'),
  communicationLogController.createLog
);

/**
 * @swagger
 * /crm/logs/customer/{customerId}:
 *   get:
 *     tags: [CommunicationLogs]
 *     summary: List logs for a customer
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Logs list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CommunicationLog'
 */
router.get(
  '/logs/customer/:customerId',
  requirePermission('crm:log:view'),
  communicationLogController.getLogsForCustomer
);

/**
 * @swagger
 * /crm/logs/supplier/{supplierId}:
 *   get:
 *     tags: [CommunicationLogs]
 *     summary: List logs for a supplier
 *     parameters:
 *       - name: supplierId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Logs list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CommunicationLog'
 */
router.get(
  '/logs/supplier/:supplierId',
  requirePermission('crm:log:view'),
  communicationLogController.getLogsForSupplier
);

/**
 * @swagger
 * /crm/logs/user/{userId}:
 *   get:
 *     tags: [CommunicationLogs]
 *     summary: List logs for a user
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Logs list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CommunicationLog'
 */
router.get(
  '/logs/user/:userId',
  requirePermission('crm:log:view'),
  communicationLogController.getLogsForUser
);

/**
 * @swagger
 * /crm/logs/{id}:
 *   get:
 *     tags: [CommunicationLogs]
 *     summary: Get a communication log by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Log entry
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommunicationLog'
 *       404:
 *         description: Not Found
 */
router.get(
  '/logs/:id',
  requirePermission('crm:log:view'),
  communicationLogController.getLogById
);


export default router;
