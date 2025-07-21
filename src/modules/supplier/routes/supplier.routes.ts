import { Router } from 'express';

import { supplierController } from '../controllers/supplier.controller';
import { requireAuth } from '@middleware/requireAuth';
import { requirePermission } from '@middleware/requirePermission';
import { productSupplierController } from '../controllers/productSupplier.controller';


const router = Router();
router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   - name: Supplier
 *     description: Supplier management endpoints
 */

/**
 * @swagger
 * /supplier:
 *   post:
 *     tags: [Supplier]
 *     summary: Create a new supplier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSupplierDto'
 *     responses:
 *       201:
 *         description: Created supplier
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Supplier'
 */
router.post(
  '/',
  requirePermission('supplier:create'),
  supplierController.createSupplier
);

/**
 * @swagger
 * /supplier:
 *   get:
 *     tags: [Supplier]
 *     summary: List all suppliers for the tenant
 *     responses:
 *       200:
 *         description: List of suppliers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Supplier'
 */
router.get(
  '/',
  requirePermission('supplier:view'),
  supplierController.getSuppliers
);

/**
 * @swagger
 * /supplier/{id}:
 *   put:
 *     tags: [Supplier]
 *     summary: Update a supplier
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
 *             $ref: '#/components/schemas/UpdateSupplierDto'
 *     responses:
 *       200:
 *         description: Updated supplier
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Supplier'
 */
router.put(
  '/:id',
  requirePermission('supplier:update'),
  supplierController.updateSupplier
);

/**
 * @swagger
 * /supplier/{id}:
 *   delete:
 *     tags: [Supplier]
 *     summary: Delete a supplier
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
  '/:id',
  requirePermission('supplier:delete'),
  supplierController.deleteSupplier
);


export default router;