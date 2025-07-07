// src/modules/crm/routes.ts

import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';
import { requirePermission } from '@middleware/requirePermission';
import { requireAuth } from '@middleware/requireAuth';

const router = Router();
router.use(requireAuth);

// Customer
/**
 * @swagger
 * tags:
 *   - name: CRM
 *     description: Customer management endpoints
 */

/**
 * @swagger
 * /crm/customers:
 *   post:
 *     tags: [CRM]
 *     summary: Create a new customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCustomerDto'
 *     responses:
 *       201:
 *         description: Created customer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 */
router.post(
  '/customers',
  requirePermission('crm:customer:create'),
  customerController.createCustomer
);

/**
 * @swagger
 * /crm/customers:
 *   get:
 *     tags: [CRM]
 *     summary: List all customers for the tenant
 *     responses:
 *       200:
 *         description: List of customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Customer'
 */
router.get(
  '/customers',
  requirePermission('crm:customer:view'),
  customerController.getCustomers
);

/**
 * @swagger
 * /crm/customers/{id}:
 *   get:
 *     tags: [CRM]
 *     summary: Get a customer by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Not Found
 */
router.get(
  '/customers/:id',
  requirePermission('crm:customer:view'),
  customerController.getCustomerById
);

/**
 * @swagger
 * /crm/customers/{id}:
 *   put:
 *     tags: [CRM]
 *     summary: Update a customer
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCustomerDto'
 *     responses:
 *       200:
 *         description: Updated customer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 */
router.put(
  '/customers/:id',
  requirePermission('crm:customer:update'),
  customerController.updateCustomer
);

/**
 * @swagger
 * /crm/customers/{id}:
 *   delete:
 *     tags: [CRM]
 *     summary: Delete a customer
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deleted
 */
router.delete(
  '/customers/:id',
  requirePermission('crm:customer:delete'),
  customerController.deleteCustomer
);


export default router;
