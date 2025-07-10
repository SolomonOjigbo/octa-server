import { Router } from "express";
import { transactionController } from "../controllers/transaction.controller";
import { requirePermission } from "@middleware/requirePermission";
import { requireAuth } from "@middleware/requireAuth";

const router = Router();
router.use(requireAuth);
/**
 * @swagger
 * tags:
 *   - name: Transactions
 *     description: Generic financial transactions ledger
 */


/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     tags: [Transactions]
 *    summary: search transactions by query parameters
 *  parameters:
 *      - name: id
 *        in: path
 *       required: true
 *     schema:
 * 
 * 
 */
router.get("/search", transactionController.searchTransactions.bind(transactionController));

/**
 * @swagger
 * /transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: List all transactions for current tenant
 *     security: [bearerAuth: []]
 *     responses:
 *       200:
 *         description: Array of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TransactionResponseDto'
 */
router.get(
  '/',
  requirePermission('transaction:read'),
  transactionController.list
);

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     tags: [Transactions]
 *     summary: Get a transaction by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Transaction record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionResponseDto'
 */
router.get(
  '/:id',
  requirePermission('transaction:read'),
  transactionController.getById
);

/**
 * @swagger
 * /transactions:
 *   post:
 *     tags: [Transactions]
 *     summary: Create a new transaction
 *     security: [bearerAuth: []]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTransactionDto'
 *     responses:
 *       201:
 *         description: Transaction created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionResponseDto'
 */
router.post(
  '/',
  requirePermission('transaction:create'),
  transactionController.create
);

/**
 * @swagger
 * /transactions/{id}:
 *   patch:
 *     tags: [Transactions]
 *     summary: Update an existing transaction
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTransactionDto'
 *     responses:
 *       200:
 *         description: Transaction updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionResponseDto'
 */
router.patch(
  '/:id',
  requirePermission('transaction:update'),
  transactionController.update
);

/**
 * @swagger
 * /transactions/{id}:
 *   delete:
 *     tags: [Transactions]
 *     summary: Delete a transaction
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Transaction deleted
 */
router.delete(
  '/:id',
  requirePermission('transaction:delete'),
  transactionController.delete
);

export default router;
