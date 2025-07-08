import { Router } from "express";
import { productController } from "../controllers/product.controller";
import { requireAuth } from "@middleware/requireAuth";
import { requirePermission } from "@middleware/requirePermission";
import { validate } from "@middleware/validate";
import { 
  createProductCategorySchema,
  updateProductCategorySchema,
} from "../validations";
import { rateLimiter } from "@middleware/rateLimiter";
import { categoryController } from "../controllers/category.controller";


const router = Router();

// Apply rate limiting
router.use(rateLimiter(100, 60 * 1000)); // 100 requests per minute

// ========== Product Category Routes ==========
/**
 * @swagger
 * tags:
 *   name: Product Categories
 *   description: Product category management
 */

/**
 * @swagger
 * /products/categories:
 *   post:
 *     summary: Create a new product category
 *     tags: [Product Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductCategoryDto'
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductCategory'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (missing permissions)
 */
router.post(
  '/categories',
  requireAuth,
  requirePermission('product:category:create'),
  validate(createProductCategorySchema),
  categoryController.createCategory
);

/**
 * @swagger
 * /products/categories:
 *   get:
 *     summary: Get all product categories
 *     tags: [Product Categories]
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
 *         description: Search term for category name
 *       - in: query
 *         name: withProducts
 *         schema:
 *           type: boolean
 *         description: Include product count in response
 *     responses:
 *       200:
 *         description: List of product categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductCategory'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/categories',
  requireAuth,
  requirePermission('product:category:view'),
  categoryController.getCategories
);
/**
 * @swagger
 * /products/categories/{id}:
 *   get:
 *     summary: Get a product category by ID
 *     tags: [Product Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *       - in: query
 *         name: withProducts
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include product count in response
 *     responses:
 *       200:
 *         description: Product category details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductCategory'
 *       400:
 *         description: Invalid category ID format
 */
router.get(
  '/categories/:id',
  requireAuth,
  requirePermission('product:category:view'),
  categoryController.getCategoryById
);
/**
 * @swagger
 * /products/categories/{id}:
 *   put:
 *     summary: Update a product category
 *     tags: [Product Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductCategoryDto'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductCategory'
 *       400:
 *         description: Validation error or invalid ID format
 */
router.put(
  '/categories/:id',    
    requireAuth,
    requirePermission('product:category:update'),
    validate(updateProductCategorySchema),
    categoryController.updateCategory
);
/**
 * @swagger
 * /products/categories/{id}:
 *   delete:
 *     summary: Delete a product category
 *     tags: [Product Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     responses:
 *       204:
 *         description: Category deleted successfully
 *       400:
 *         description: Invalid category ID format
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/categories/:id',
  requireAuth,
  requirePermission('product:category:delete'),
  categoryController.deleteCategory
);

// /**
//  * @swagger
//  * /products/categories/store/{storeId}:
//  *   get:
//  *     summary: Get all product categories for a store
//  *     tags: [Product Categories]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: storeId
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: Store ID
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *           default: 1
//  *         description: Page number
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *           default: 10
//  *         description: Items per page
//  *       - in: query
//  *         name: search
//  *         schema:
//  *           type: string
//  *         description: Search term for category name
//  *       - in: query
//  *         name: withProducts
//  *         schema:
//  *           type: boolean
//  *         description: Include product count in response
//  *     responses:
//  *       200:
//  *         description: List of product categories for the store
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *              properties:
//  *                data:
//  *                 type: array
//  *                items:
//  *                 $ref: '#/components/schemas/ProductCategory'
//  *               pagination:
//  *                $ref: '#/components/schemas/Pagination'
//  * *       401:
//  *        description: Unauthorized
//  * */
// router.get(
//     '/categories/store/:storeId',
//     requireAuth,
//     requirePermission('product:category:view'),
//     categoryController.getCategoriesByStore
//     );
/** * @swagger
 * /products/categories/warehouse/{warehouseId}:
 *  get:
 *    summary: Get all product categories for a warehouse
 * *    tags: [Product Categories]
 * *    security:
 *      - bearerAuth: []
 * *    parameters:
 *     - in: path
 *       name: warehouseId
 *      schema:
 *        type: string
 *      required: true
 *      description: Warehouse ID
 * *    - in: query
 *      name: page
 *     schema:
 *       type: integer
 *      default: 1
 *     description: Page number
 * *    - in: query
 *     name: limit
 * *    schema:
 *      type: integer
 *     default: 10
 * *    description: Items per page
 * *    - in: query
 *     name: search
 * *    schema:
 *      type: string
 * *     description: Search term for category name
 * *    - in: query
 *    name: withProducts
 * *   schema:
 *      type: boolean
 * *     description: Include product count in response
 * *  responses:
 * *   200:
 * *     description: List of product categories for the warehouse
 * *     content:
 *          application/json:
 *            schema:
 *              type: object
 * *             properties:
 * *               data:
 * *                type: array
 * *               items:
 * *                $ref: '#/components/schemas/ProductCategory'
 * *               pagination:
 * *                $ref: '#/components/schemas/Pagination'
 * *   401:
 * *     description: Unauthorized
 * */
// router.get(
//     '/categories/warehouse/:warehouseId',
//     requireAuth,
//     requirePermission('product:category:read'),
//     productController.getCategoriesByWarehouse
//     );


// ... (similar Swagger docs for other category endpoints)

export default router;
