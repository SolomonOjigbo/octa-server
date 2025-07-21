import { Router } from 'express';
import {
  createRefund,
  getRefundById,
  listRefunds,
} from '../controllers/refund.controller';
import { validate } from '@middleware/validate';
import { CreateRefundDtoSchema } from '../validations';
import { requireAuth } from '@middleware/requireAuth';
import { requirePermission } from '@middleware/requirePermission';


const router = Router();
router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   - name: Refunds
 *     description: Refund and return operations
 */

/**
 * @swagger
 * /refunds:
 *   post:
 *     tags: [Refunds]
 *     summary: Create a refund for a transaction or purchase order return
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRefundDto'
 *     responses:
 *       201:
 *         description: Refund created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefundResponseDto'
 */
router.post('/', validate(CreateRefundDtoSchema), requirePermission, createRefund);

/**
 * @swagger
 * /refunds/{id}:
 *   get:
 *     tags: [Refunds]
 *     summary: Get a specific refund by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Refund ID
 *     responses:
 *       200:
 *         description: Refund details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefundResponseDto'
 */
router.get('/:id', getRefundById);

/**
 * @swagger
 * /refunds:
 *   get:
 *     tags: [Refunds]
 *     summary: List all refunds with optional filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: transactionId
 *         schema:
 *           type: string
 *         description: Filter by transaction ID
 *       - in: query
 *         name: purchaseOrderId
 *         schema:
 *           type: string
 *         description: Filter by purchase order ID
 *     responses:
 *       200:
 *         description: Array of refunds
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RefundResponseDto'
 */
router.get('/', listRefunds);

export default router;
