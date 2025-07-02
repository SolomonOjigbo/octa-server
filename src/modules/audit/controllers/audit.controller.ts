// src/modules/audit/audit.controller.ts

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { auditService } from '../services/audit.service';
import { z } from 'zod';
import { AuditLogCreateParams, AuditLogQueryParams } from '../types/audit.dto';
import { logger } from '@logging/logger';

// Zod schema to validate incoming audit queries
const AuditQuerySchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

const CreateAuditSchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  action: z.string(),
  metadata: z.record(z.any()).optional(),
  description: z.string().optional(),
});

export class AuditController {
  /**
   * GET /audit
   * Query and paginate audit logs for the tenant
   */
  async getAuditLogs (req: Request, res: Response) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

    const validated = AuditQuerySchema.parse(req.query);

    const logs = await auditService.getAll({
      ...validated,
      tenantId,
    } as AuditLogQueryParams);

    res.json(logs);
  }

  /**
   * GET /audit/:id
   * Fetch a single audit log by ID
   */
  async getAuditLogById(req: Request, res: Response) {
    const log = await auditService.getById(req.params.id);
    res.json(log);
  }

  /**
   * POST /audit
   * Manually log an audit entry (used internally by services)
   */
  async createAuditLog(req: Request, res: Response) {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      return res.status(401).json({ error: 'Unauthorized audit access' });
    }

    const validated = CreateAuditSchema.parse(req.body);

    const log = await auditService.log({
      tenantId,
      userId,
      action: validated.action,
      entityType: validated.entityType,
      entityId: validated.entityId,
      metadata: validated.metadata,
      // description: validated.description,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(log);
  }
    async purgeAuditLogs(req: Request, res: Response) {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ 
          error: "Forbidden",
          message: "Admin access required" 
        });
      }

      const days = parseInt(req.query.days as string) || 365;
      const count = await auditService.purgeOldLogs(days);
      
      res.json({ 
        success: true,
        purgedCount: count 
      });
    } catch (error) {
      logger.error("Failed to purge audit logs", { error });
      res.status(500).json({ 
        error: "ServerError",
        message: "Failed to purge audit logs" 
      });
    }
  }
  
};

export const auditController = new AuditController();