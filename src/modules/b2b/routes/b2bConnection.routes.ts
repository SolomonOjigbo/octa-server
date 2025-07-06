import { Router } from "express";
import { b2bConnectionController } from "../controllers/b2bConnection.controller";
import { requireAuth } from "@middleware/requireAuth";
import { requirePermission } from "@middleware/requirePermission";

const router = Router();

// B2B Connection CRUD routes
/**
   * @swagger
   * /b2b/connections:
   *   post:
   *     tags: [B2B Connections]
   *     summary: Create a new B2B connection request
   *     description: Initiate a connection request between two tenants
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateB2BConnectionDto'
   *     responses:
   *       201:
   *         description: B2B connection created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/B2BConnectionResponseDto'
   *       400:
   *         description: Validation error or business rule violation
   *       401:
   *         description: Unauthorized
   */
router.post(
  "/",
  requireAuth,
  requirePermission("b2b:create"),
  b2bConnectionController.createConnection.bind(b2bConnectionController)
);

/**
   * @swagger
   * /b2b/connections:
   *   get:
   *     tags: [B2B Connections]
   *     summary: List B2B connections
   *     description: Retrieve paginated list of B2B connections for the current tenant
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, approved, rejected, revoked]
   *         description: Filter by connection status
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [general, wholesale, distributor, clinic]
   *         description: Filter by connection type
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
   *           default: 20
   *         description: Items per page
   *     responses:
   *       200:
   *         description: Paginated list of B2B connections
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/B2BConnectionResponseDto'
   *                 pagination:
   *                   $ref: '#/components/schemas/PaginationMeta'
   *       401:
   *         description: Unauthorized
   */
router.get(
  "/",
  requireAuth,
  requirePermission("b2b:read"),
  b2bConnectionController.listConnectionsForTenant.bind(b2bConnectionController)
);

/**
   * @swagger
   * /b2b/connections/{id}:
   *   get:
   *     tags: [B2B Connections]
   *     summary: Get B2B connection details
   *     description: Retrieve details of a specific B2B connection
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: B2B connection ID
   *     responses:
   *       200:
   *         description: B2B connection details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/B2BConnectionWithRelationsDto'
   *       404:
   *         description: Connection not found
   *       401:
   *         description: Unauthorized
   */
router.get(
  "/:id",
  requireAuth,
  requirePermission("b2b:read"),
  b2bConnectionController.getConnectionById.bind(b2bConnectionController)
);

/**
   * @swagger
   * /b2b/connections/{id}:
   *   put:
   *     tags: [B2B Connections]
   *     summary: Update B2B connection
   *     description: Update connection settings or metadata
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: B2B connection ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateB2BConnectionDto'
   *     responses:
   *       200:
   *         description: Updated B2B connection
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/B2BConnectionResponseDto'
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden (not authorized to update)
   */
router.put(
  "/:id",
  requireAuth,
  requirePermission("b2b:update"),
  b2bConnectionController.updateConnection.bind(b2bConnectionController)
);

/**
   * @swagger
   * /b2b/connections/{id}:
   *   delete:
   *     tags: [B2B Connections]
   *     summary: Delete B2B connection
   *     description: Delete a B2B connection (only allowed by initiating tenant)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: B2B connection ID
   *     responses:
   *       204:
   *         description: Connection deleted successfully
   *       400:
   *         description: Invalid request
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden (not authorized to delete)
   */
router.delete(
  "/:id",
  requireAuth,
  requirePermission("b2b:delete"),
  b2bConnectionController.deleteConnection.bind(b2bConnectionController)
);

/**
   * @swagger
   * /b2b/connections/status:
   * get:
   * tags: [B2B Connections]
   * summary: Check connection status with a partner tenant
   * description: Quickly retrieve the current connection status (e.g., 'approved', 'pending', or null) with a specific partner tenant. This is useful for UI logic, such as enabling a 'Place Purchase Order' button.
   * security:
   * - bearerAuth: []
   * parameters:
   * - in: query
   * name: partnerTenantId
   * required: true
   * schema:
   * type: string
   * description: The ID of the partner tenant to check the connection status with.
   * responses:
   * 200:
   * description: The current connection status.
   * content:
   * application/json:
   * schema:
   * type: object
   * properties:
   * status:
   * type: string
   * enum: [pending, approved, null]
   * description: The status of the connection, or null if no active/pending connection exists.
   * 400:
   * description: Invalid partnerTenantId provided.
   * 401:
   * description: Unauthorized.
   */
router.get(
  "/status",
  requireAuth,
  requirePermission("b2b:read"),
  b2bConnectionController.checkConnectionStatus.bind(b2bConnectionController)
);


// Connection lifecycle routes
/**
   * @swagger
   * /b2b/connections/{id}/approve:
   *   put:
   *     tags: [B2B Connections]
   *     summary: Approve B2B connection
   *     description: Approve a pending B2B connection request
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: B2B connection ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ApproveB2BConnectionDto'
   *     responses:
   *       200:
   *         description: B2B connection approved
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/B2BConnectionResponseDto'
   *       400:
   *         description: Invalid request or connection not pending
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden (not authorized to approve)
   */
router.put(
  "/:id/approve",
  requireAuth,
  requirePermission("b2b:approve"),
  b2bConnectionController.approveConnection.bind(b2bConnectionController)
);


/**
   * @swagger
   * /b2b/connections/{id}/reject:
   *   put:
   *     tags: [B2B Connections]
   *     summary: Reject B2B connection
   *     description: Reject a pending B2B connection request
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: B2B connection ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RejectB2BConnectionDto'
   *     responses:
   *       200:
   *         description: B2B connection rejected
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/B2BConnectionResponseDto'
   *       400:
   *         description: Invalid request or connection not pending
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden (not authorized to reject)
   */
router.put(
  "/:id/reject",
  requireAuth,
  requirePermission("b2b:reject"), 
  b2bConnectionController.rejectConnection.bind(b2bConnectionController)
);


/**
   * @swagger
   * /b2b/connections/{id}/revoke:
   *   put:
   *     tags: [B2B Connections]
   *     summary: Revoke B2B connection
   *     description: Revoke an approved B2B connection
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: B2B connection ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RevokeB2BConnectionDto'
   *     responses:
   *       200:
   *         description: B2B connection revoked
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/B2BConnectionResponseDto'
   *       400:
   *         description: Invalid request or connection not approved
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden (not authorized to revoke)
   */

router.put(
  "/:id/revoke",
  requireAuth,
  requirePermission("b2b:revoke"), 
  b2bConnectionController.revokeConnection.bind(b2bConnectionController)
);

// History and metadata
/**
   * @swagger
   * /b2b/connections/{id}/history:
   *   get:
   *     tags: [B2B Connections]
   *     summary: Get connection history
   *     description: Retrieve audit history for a B2B connection
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: B2B connection ID
   *     responses:
   *       200:
   *         description: List of audit events
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/AuditLogResponseDto'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden (not authorized to view history)
   */
router.get(
  "/:id/history",
  requireAuth,
  requirePermission("b2b:read"),
  b2bConnectionController.getConnectionHistory.bind(b2bConnectionController)
);

export default router;