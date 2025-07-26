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
 * /audit:
 *   get:
 *     tags: [Audit]
 *     summary: List audit logs
 *     parameters:
 *       - name: module
 *         in: query
 *         schema:
 *           type: string
 *       - name: entityId
 *         in: query
 *         schema:
 *           type: string
 *       - name: action
 *         in: query
 *         schema:
 *           type: string
 *       - name: userId
 *         in: query
 *         schema:
 *           type: string
 *       - name: dateFrom
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: dateTo
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of audit logs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditLogList'
 */

// GET /audit - list logs
router.get(
  '/',
  requirePermission('audit:view'),
  auditController.getLogs
);


export default router;