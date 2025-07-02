import { Router } from "express";
import { productController } from "../controllers/product.controller";
import { requireAuth } from "@middleware/requireAuth";
import { requirePermission } from "@middleware/requirePermission";
import { validate } from "@middleware/validate";
import { 
  createProductSchema,
  updateProductSchema,
  createProductVariantSchema,
  updateProductVariantSchema
} from "../validations";
import { rateLimiter } from "@middleware/rateLimiter";

const router = Router();





// Apply rate limiting
router.use(rateLimiter(100, 60 * 1000)); // 100 requests per minute

// ========== Product CRUD Routes ==========
/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductDto'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 */
router.post(
  '/',
  requireAuth,
  requirePermission('product:create'),
  validate(createProductSchema),
  productController.createProduct
);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         required: true
 *         description: Tenant ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product name, SKU or description
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: sku
 *         schema:
 *           type: string
 *         description: Filter by SKU
 *       - in: query
 *         name: barcode
 *         schema:
 *           type: string
 *         description: Filter by barcode
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum selling price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum selling price filter
 *       - in: query
 *         name: locationType
 *         schema:
 *           type: string
 *           enum: [store, warehouse]
 *         description: Location type for stock filtering
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         description: Location ID for stock filtering
 *       - in: query
 *         name: withStock
 *         schema:
 *           type: boolean
 *         description: Include stock information
 *       - in: query
 *         name: withSuppliers
 *         schema:
 *           type: boolean
 *         description: Include supplier information
 *       - in: query
 *         name: withInventory
 *         schema:
 *           type: boolean
 *         description: Include inventory movements
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  requireAuth,
  requirePermission('product:read'),
  productController.getProducts
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
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
 *             $ref: '#/components/schemas/UpdateProductDto'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error or invalid ID format
 */
router.put(
  '/:id',
  requireAuth,
  requirePermission('product:update'),
  validate(updateProductSchema),
  productController.updateProduct
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       204:
 *         description: Product deleted successfully
 *       400:
 *         description: Invalid product ID format
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/:id',
  requireAuth,
  requirePermission('product:delete'),
  productController.deleteProduct
);

// ========== Product Location Routes ==========
/**
 * @swagger
 * /products/store/{storeId}:
 *   get:
 *     summary: Get all products for a store
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         schema:
 *           type: string
 *         required: true
 *         description: Store ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product name, SKU or description
 *       - in: query
 *         name: withStock
 *         schema:
 *           type: boolean
 *         description: Include stock information
 */
router.get(
  '/store/:storeId',
  requireAuth,
  requirePermission('product:read'),
  productController.getProductsByStore
);
/**
 * @swagger
 * /products/warehouse/{warehouseId}:
 *   get:
 *     summary: Get all products for a warehouse
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: warehouseId
 *         schema:
 *           type: string
 *         required: true
 *         description: Warehouse ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product name, SKU or description
 */
router.get(
  '/warehouse/:warehouseId',
  requireAuth,
  requirePermission('product:read'),
  productController.getProductsByWarehouse
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
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
 *         description: Include stock information
 *       - in: query
 *         name: withSuppliers
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include supplier information
 *       - in: query
 *         name: withInventory
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inventory movements
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid product ID format
 */
router.get(
  '/:id',
  requireAuth,
  requirePermission('product:read'),
  productController.getProductById
);

// ... (similar Swagger docs for other variant endpoints)

// ========== Batch Operations ==========
/**
 * @swagger
 * /products/import:
 *   post:
 *     summary: Import multiple products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/CreateProductDto'
 *     responses:
 *       201:
 *         description: Products imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product:
 *                         $ref: '#/components/schemas/CreateProductDto'
 *                       error:
 *                         type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 */
router.post(
  '/import',
  requireAuth,
  requirePermission('product:import'),
  productController.importProducts
);

/**
 * @swagger
 * /products/export:
 *   get:
 *     summary: Export products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         required: true
 *         description: Tenant ID
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json]
 *           default: json
 *         description: Export format
 *       - in: query
 *         name: includeStock
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include stock information
 *       - in: query
 *         name: includeVariants
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include variant information
 *     responses:
 *       200:
 *         description: Products exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 */
router.get(
  '/export',
  requireAuth,
  requirePermission('product:export'),
  productController.exportProducts
);

// ========== Search & Lookup Routes ==========
/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Search products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         required: true
 *         description: Tenant ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to return
 *       - in: query
 *         name: withStock
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include stock information
 *       - in: query
 *         name: locationType
 *         schema:
 *           type: string
 *           enum: [store, warehouse]
 *         description: Location type for stock filtering
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         description: Location ID for stock filtering
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       400:
 *         description: Missing search query
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/search',
  requireAuth,
  requirePermission('product:read'),
  productController.searchProducts
);

export default router;