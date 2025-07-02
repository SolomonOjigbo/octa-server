// src/modules/audit/audit.routes.ts

import { Router } from 'express';
import { auditController } from '../controllers/audit.controller';
import { requireAuth } from '@middleware/requireAuth';
import { requirePermission } from '@middleware/requirePermission';
import { rateLimiter } from '@middleware/rateLimiter';

const router = Router();

router.use(requireAuth);

 /**
   * @swagger
    *    /audit:
    *    get:
    *        tags: [Audit]
    *        summary: List audit logs
    *        parameters:
    *        - name: entityType
    *            in: query
    *            schema:
    *            type: string
    *        - name: entityId
    *            in: query
    *            schema:
    *            type: string
    *        - name: action
    *            in: query
    *            schema:
    *            type: string
    *        - name: userId
    *            in: query
    *            schema:
    *            type: string
    *        - name: dateFrom
    *            in: query
    *            schema:
    *            type: string
    *            format: date
    *        - name: dateTo
    *            in: query
    *            schema:
    *            type: string
    *            format: date
    *        - name: page
    *            in: query
    *            schema:
    *            type: integer
    *        - name: limit
    *            in: query
    *            schema:
    *            type: integer
    *        responses:
    *        200:
    *            description: List of audit logs
    *            content:
    *            application/json:
    *                schema:
    *                $ref: '#/components/schemas/AuditLogList'
    */

// GET /audit - list logs
router.get(
  '/',
  requirePermission('audit:read'),
  auditController.getAuditLogs
);


/**
 * @swagger
 * /audit:
 *   post:
 *     tags: [Audit]
 *     summary: Create an audit log entry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuditLogCreate'
 *     responses:
 *       201:
 *         description: Audit log created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditLog'
*/
// POST /audit - programmatic audit log (used by internal services)
router.post(
  '/',
  requirePermission('audit:create'),
  auditController.createAuditLog
);

/**
 * 
 * @swagger
 * /audit/{id}:
 *   get:
 *     tags: [Audit]
 *     summary: Get a single audit log by ID
 *     parameters:  
 *    - name: id
 *      in: path
 *      required: true
 *      schema:
 *        type: string
 *  responses:
 *    200:
 *      description: Single audit log
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/AuditLog'
 */
// GET /audit/:id - single log by ID
router.get(
  '/:id',
  requirePermission('audit:read'),
  auditController.getAuditLogById
);


/**
 * @swagger
 * /audit/purge:
 *   delete:
 *     tags: [Audit]
 *     summary: Purge all audit logs
 *     responses:
 *       204:
 *         description: Audit logs purged successfully
 * *     security:
 *       - bearerAuth: []
 *     description: This endpoint allows purging all audit logs. Use with caution as this action cannot be undone.
 *     parameters:
 *      - in: query
 *        name: tenantId
 *       schema:
 *         type: string
 * required: true
 *     responses:
 *       204:
 *         description: Audit logs purged successfully
 *       403:
 *         description: Forbidden - user does not have permission to purge audit logs
 *       401:
 *         description: Unauthorized - user must be authenticated  
 * 
 */
router.delete(
    "/purge",
    rateLimiter(5, 60 * 60), // 5 requests per hour
  requireAuth,
  requirePermission("audit:purge"),
  auditController.purgeAuditLogs.bind(auditController)
);

export default router;