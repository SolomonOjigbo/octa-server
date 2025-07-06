// src/modules/businessEntity/routes/businessEntity.routes.ts

import { Router } from "express";
import { businessEntityController } from "../controllers/businessEntity.controller";
import { requireAuth } from "@middleware/requireAuth";
import { requirePermission } from "@middleware/requirePermission";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: BusinessEntity
 *     description: Business entity endpoints
 */
/**
 * @swagger
 * /business-entities:
 *   post:
 *     summary: Create a business entity
 *     tags: [BusinessEntity]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BusinessEntity'
 *     responses:
 *       201:
 *         description: Business entity created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusinessEntity'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.post(
  "/",
  requireAuth,
  requirePermission("business_entity:create"),
  businessEntityController.createEntity.bind(businessEntityController)
);

/**
 * @swagger
 * /business-entities:
 *   get:
 *     summary: Get all business entities for a tenant
 *     tags: [BusinessEntity]
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
 *         description: List of business entities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BusinessEntity'
 *       403:
 *         description: Forbidden
 */
router.get(
  "/",
  requireAuth,
  requirePermission("business_entity:view"),
  businessEntityController.getEntities.bind(businessEntityController)
);


/**
 * @swagger
 * /business-entities/{id}:
 *   get:
 *     summary: Get business entity by ID
 *     tags: [BusinessEntity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Business entity ID
 *     responses:
 *       200:
 *         description: Business entity found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusinessEntity'
 *       404:
 *         description: Not found
 *       403:
 *         description: Forbidden
 */
router.get(
  "/:id",
  requireAuth,
  requirePermission("business_entity:view"),
  businessEntityController.getEntityById.bind(businessEntityController)
);

/**
 * @swagger
 * /business-entities/{id}:
 *   put:
 *     summary: Update business entity by ID
 *     tags: [BusinessEntity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Business entity ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BusinessEntity'
 *     responses:
 *       200:
 *         description: Business entity updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusinessEntity'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.put(
  "/:id",
  requireAuth,
  requirePermission("business_entity:update"),
  businessEntityController.updateEntity.bind(businessEntityController)
);

/**
 * @swagger
 * /business-entities/{id}:
 *   delete:
 *     summary: Delete business entity by ID
 *     tags: [BusinessEntity]
 *    security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Business entity ID
 *     responses:
 *       204:
 *         description: Business entity deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 * 
 * */

router.delete(
  "/:id",
  requireAuth,
  requirePermission("business_entity:delete"),
  businessEntityController.deleteEntity.bind(businessEntityController)
);
export default router;