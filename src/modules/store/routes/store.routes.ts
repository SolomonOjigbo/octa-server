import { Router } from "express";
import { storeController } from "../controllers/store.controller";
import { requireAuth } from "../../../middleware/requireAuth";
import { requirePermission } from "../../../middleware/requirePermission";


const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Store
 *     description: Store endpoints
 */

/**
 * @swagger
 * /stores:
 *   post:
 *     summary: Create a store
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Store'
 *     responses:
 *       201:
 *         description: Store created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Store'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */

router.post(
  "/",
  requireAuth,
  requirePermission("store:create"),
  storeController.createStore.bind(storeController)
);


/**
 * @swagger
 * /stores:
 *   get:
 *     summary: Get all stores for a tenant
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         required: true
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: List of stores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Store'
 *       403:
 *         description: Forbidden
 */
router.get(
  "/",
  requireAuth,
  requirePermission("store:read"),
  storeController.getStores.bind(storeController)
);


/**
 * @swagger
 * /stores/{id}:
 *   get:
 *     summary: Get store by ID
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Store found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Store'
 *       404:
 *         description: Not found
 *       403:
 *         description: Forbidden
 * 
 */

router.get(
  "/:id",
  requireAuth,
  requirePermission("store:read"),
  storeController.getStoreById.bind(storeController)
);


/**
 * @swagger
 * /stores/{id}:
 *   put:
 *     summary: Update store by ID
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Store ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Store'
 *     responses:
 *       200:
 *         description: Store updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Store'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */

router.put(
  "/:id",
  requireAuth,
  requirePermission("store:update"),
  storeController.updateStore.bind(storeController)
);


/**
 * @swagger
 * /stores/{id}:
 *   delete:
 *     summary: Delete store by ID
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Store ID
 *     responses:
 *       204:
 *         description: Store deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  "/:id",
  requireAuth,
  requirePermission("store:delete"),
  storeController.deleteStore.bind(storeController)
);

export default router;