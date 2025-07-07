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


/**
 * @swagger
 * tags:
 *   - name: ProductSupplier
 *     description: Link products to suppliers
 */

/**
 * @swagger
 * /supplier/products/link:
 *   post:
 *     tags: [ProductSupplier]
 *     summary: Link a product to a supplier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductSupplierDto'
 *     responses:
 *       201:
 *         description: Linked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductSupplier'
 */
router.post(
  '/products/link',
  requirePermission('supplier:link'),
  productSupplierController.linkProduct
);

/**
 * @swagger
 * /supplier/products/{productId}:
 *   get:
 *     tags: [ProductSupplier]
 *     summary: List supplier links for a product
 *     parameters:
 *       - name: productId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Links list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductSupplier'
 */
router.get(
  '/products/:productId',
  requirePermission('supplier:read'),
  productSupplierController.getLinksForProduct
);

/**
 * @swagger
 * /supplier/products/link/{id}:
 *   patch:
 *     tags: [ProductSupplier]
 *     summary: Update a product-supplier link
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
 *             $ref: '#/components/schemas/UpdateProductSupplierDto'
 *     responses:
 *       200:
 *         description: Updated link
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductSupplier'
 */
router.patch(
  '/products/link/:id',
  requirePermission('supplier:update'),
  productSupplierController.updateLink
);

/**
 * @swagger
 * /supplier/products/link/{id}:
 *   delete:
 *     tags: [ProductSupplier]
 *     summary: Unlink a product from a supplier
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Unlinked
 */
router.delete(
  '/products/link/:id',
  requirePermission('supplier:delete'),
  productSupplierController.unlinkProduct
);

export default router;
