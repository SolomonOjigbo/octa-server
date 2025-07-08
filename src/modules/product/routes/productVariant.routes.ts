import { Router } from "express";
import { productVariantsController } from "../controllers/productVariant.controller";
import { requireAuth } from "@middleware/requireAuth";
import { requirePermission } from "@middleware/requirePermission";
import { validate } from "@middleware/validate";
import { 
  createProductVariantSchema,
  updateProductVariantSchema
} from "../validations";
import { rateLimiter } from "@middleware/rateLimiter";

const router = Router();





// Apply rate limiting
router.use(rateLimiter(100, 60 * 1000)); // 100 requests per minute


// ========== Product Variant Routes ==========
/**
 * @swagger
 * tags:
 *   name: Product Variants
 *   description: Product variant management
 */

/**
 * @swagger
 * /products/{id}/variants:
 *   post:
 *     summary: Create a new product variant
 *     tags: [Product Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductVariantDto'
 *     responses:
 *       201:
 *         description: Variant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductVariant'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 */
router.post(
  '/:id/variants',
  requireAuth,
  requirePermission('product:variant:create'),
  validate(createProductVariantSchema),
  productVariantsController.createVariant
);

/**
 * @swagger
 * /products/{id}/variants:
 *   get:
 *     summary: Get all variants for a product
 *     tags: [Product Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *       - in: query
 *         name: withStock
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include stock information for variants
 *     responses:
 *       200:
 *         description: List of product variants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductVariant'
 *       400:
 *         description: Invalid product ID format
 */
router.get(
  '/:id/variants',
  requireAuth,
  requirePermission('product:variant:read'),
  productVariantsController.getVariants
);

/**
 * @swagger
 * /products/{id}/variants/{variantId}:
 *   put:
 *     summary: Update a product variant
 *     tags: [Product Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *       - in: path
 *         name: variantId
 *         schema:
 *           type: string
 *         required: true
 *         description: Variant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductVariantDto'
 *     responses:
 *       200:
 *         description: Variant updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductVariant'
 *       400:
 *         description: Validation error or invalid IDs
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/:id/variants/:variantId',
  requireAuth,
  requirePermission('product:variant:update'),
  validate(updateProductVariantSchema),
  productVariantsController.updateVariant
);


export default router;