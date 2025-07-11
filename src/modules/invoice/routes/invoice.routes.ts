// src/modules/invoice/invoice.routes.ts

import { Router } from 'express';
import { invoiceController } from '../controllers/invoice.controller';
import { requireAuth } from '@middleware/requireAuth';
import { requirePermission } from '@middleware/requirePermission';

const router = Router();
router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   - name: Invoices
 *     description: Invoice lifecycle and billing
 */

/**
 * @swagger
 * /invoices:
 *   get:
 *     tags: [Invoices]
 *     summary: List invoices with optional filters
 *     security: [bearerAuth: []]
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [draft,issued,paid,partiallyPaid,overdue,cancelled]
 *       - name: referenceType
 *         in: query
 *         schema:
 *           type: string
 *           enum: [purchaseOrder,posTransaction,stockTransfer,b2bConnection]
 *       - name: referenceId
 *         in: query
 *         schema: { type: string }
 *       - name: customerId
 *         in: query
 *         schema: { type: string }
 *       - name: startDate
 *         in: query
 *         schema: { type: string, format: date }
 *       - name: endDate
 *         in: query
 *         schema: { type: string, format: date }
 *       - name: page
 *         in: query
 *         schema: { type: integer }
 *       - name: limit
 *         in: query
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Array of invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InvoiceResponseDto'
 */
router.get(
  '/',
  requirePermission('invoice:read'),
  invoiceController.list
);

/**
 * @swagger
 * /invoices:
 *   post:
 *     tags: [Invoices]
 *     summary: Create a draft invoice
 *     security: [bearerAuth: []]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInvoiceDto'
 *     responses:
 *       201:
 *         description: Invoice draft created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvoiceResponseDto'
 */
router.post(
  '/',
  requirePermission('invoice:create'),
  invoiceController.create
);

/**
 * @swagger
 * /invoices/{id}/issue:
 *   post:
 *     tags: [Invoices]
 *     summary: Issue a draft invoice
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
 *             $ref: '#/components/schemas/IssueInvoiceDto'
 *     responses:
 *       200:
 *         description: Invoice issued
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvoiceResponseDto'
 */
router.post(
  '/:id/issue',
  requirePermission('invoice:issue'),
  invoiceController.issue
);

/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     tags: [Invoices]
 *     summary: Get invoice details (items + payments)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invoice details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvoiceDetailDto'
 */
router.get(
  '/:id',
  requirePermission('invoice:read'),
  invoiceController.getById
);

/**
 * @swagger
 * /invoices/{id}:
 *   patch:
 *     tags: [Invoices]
 *     summary: Update an invoice (draft or dates)
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
 *             $ref: '#/components/schemas/UpdateInvoiceDto'
 *     responses:
 *       200:
 *         description: Invoice updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvoiceResponseDto'
 */
router.patch(
  '/:id',
  requirePermission('invoice:update'),
  invoiceController.update
);

/**
 * @swagger
 * /invoices/{id}:
 *   delete:
 *     tags: [Invoices]
 *     summary: Cancel or void an invoice
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Invoice deleted
 */
router.delete(
  '/:id',
  requirePermission('invoice:delete'),
  invoiceController.delete
);

/**
 * @swagger
 * /invoices/{id}/payments:
 *   post:
 *     tags: [Invoices]
 *     summary: Apply a payment to an invoice
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
 *             $ref: '#/components/schemas/ApplyPaymentDto'
 *     responses:
 *       200:
 *         description: Payment applied, invoice status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvoiceDetailDto'
 */
router.post(
  '/:id/payments',
  requirePermission('invoice:payment'),
  invoiceController.applyPayment
);

/**
 * @swagger
 * /invoices/{id}/pdf:
 *   get:
 *     tags: [Invoices]
 *     summary: Generate or retrieve invoice PDF
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF binary
 *         content:
 *           application/pdf: {}
 */
router.get(
  '/:id/pdf',
  requirePermission('invoice:pdf'),
  invoiceController.getPdf
);

export default router;
