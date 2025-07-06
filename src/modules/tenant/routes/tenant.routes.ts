import { Router } from "express";
import { tenantController } from "../controllers/tenant.controller";
import { requireAuth } from "../../../middleware/requireAuth";
import { requirePermission } from "../../../middleware/requirePermission";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Tenant
 *     description: Tenant management endpoints
 */

/**
 * @swagger
 * /tenants/onboard:
 *   post:
 *     summary: Atomic tenant onboarding (tenant, business entity, store, admin user)
 *     tags: [Tenant]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tenant:
 *                 $ref: '#/components/schemas/Tenant'
 *               businessEntity:
 *                 $ref: '#/components/schemas/BusinessEntity'
 *               store:
 *                 $ref: '#/components/schemas/Store'
 *               adminUser:
 *                 $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Onboarding completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tenant:
 *                   $ref: '#/components/schemas/Tenant'
 *                 businessEntity:
 *                   $ref: '#/components/schemas/BusinessEntity'
 *                 store:
 *                   $ref: '#/components/schemas/Store'
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation or onboarding error
 */
router.post(
  "/onboard",
  tenantController.atomicTenantOnboarding.bind(tenantController)
);

// Get all tenants (admin only)
/**
 * @swagger
 * /tenants:
 *   get:
 *     summary: Get all tenants (admin only)
 *     tags: [Tenant]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tenants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tenant'
 *       403:
 *         description: Forbidden
 */
router.get(
  "/",
  requireAuth,
  requirePermission("tenant:view"),
  tenantController.getTenants.bind(tenantController)
);

/**
 * @swagger
 * /tenants/{id}:
 *   get:
 *     summary: Get tenant by ID
 *     tags: [Tenant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Tenant found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 *       404:
 *         description: Not found
 */
router.get(
  "/:id",
  requireAuth,
  requirePermission("tenant:view"),
  tenantController.getTenantById.bind(tenantController)
);

/**
 * @swagger
 * /tenants/{id}:
 *   put:
 *     summary: Update tenant by ID
 *     tags: [Tenant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Tenant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tenant'
 *     responses:
 *       200:
 *         description: Tenant updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.put(
  "/:id",
  requireAuth,
  requirePermission("tenant:update"),
  tenantController.updateTenant.bind(tenantController)
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("tenant:delete"),
  tenantController.deleteTenant.bind(tenantController)
);

// B2B Connections
router.get(
  "/b2b/connections",
  requireAuth,
  requirePermission("tenant:view"),
  tenantController.getTenantsWithB2B.bind(tenantController)
);

export default router;