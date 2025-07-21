import { Router } from 'express';
import { validate } from '@middleware/validate';
import {
  CreateProductSupplierDtoSchema,
  UpdateProductSupplierDtoSchema,
} from '../types/productSupplier.dto';
import { productSupplierController } from '../controllers/productSupplier.controller';
import { requireAuth } from '@middleware/requireAuth';
import { requirePermission } from '@middleware/requirePermission';

const router = Router();
router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   - name: ProductSupplier
 *     description: Link products (tenant or global) to suppliers
 */

/**
 * @swagger
 * /product-suppliers/link:
 *   post:
 *     tags: [ProductSupplier]
 *     summary: Link a product to a supplier
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductSupplierDto'
 *     responses:
 *       201:
 *         description: Product-supplier link created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductSupplierResponseDto'
 */
router.post(
  '/link',
  requirePermission('productSupplier:create'),
  validate(CreateProductSupplierDtoSchema),
  productSupplierController.linkProduct
);

/**
 * @swagger
 * /product-suppliers/link/{id}:
 *   patch:
 *     tags: [ProductSupplier]
 *     summary: Update a product-supplier link
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Link ID
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
 *               $ref: '#/components/schemas/ProductSupplierResponseDto'
 */
router.patch(
  '/link/:id',
  requirePermission('productSupplier:update'),
  validate(UpdateProductSupplierDtoSchema),
  productSupplierController.updateLink
);

/**
 * @swagger
 * /product-suppliers/link/{id}:
 *   delete:
 *     tags: [ProductSupplier]
 *     summary: Unlink a product from a supplier
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Link ID
 *     responses:
 *       204:
 *         description: Link deleted
 */
router.delete(
  '/link/:id',
  requirePermission('productSupplier:delete'),
  productSupplierController.unlinkProduct
);

/**
 * @swagger
 * /product-suppliers:
 *   get:
 *     tags: [ProductSupplier]
 *     summary: List supplier links for a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantProductId
 *         schema:
 *           type: string
 *         description: Tenant’s product ID
 *       - in: query
 *         name: globalProductId
 *         schema:
 *           type: string
 *         description: Global catalog product ID
 *     responses:
 *       200:
 *         description: Array of product-supplier links
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductSupplierResponseDto'
 */
router.get(
  '/',
  requirePermission('productSupplier:read'),
  productSupplierController.getLinksForProduct
);

export default router;
