import { z } from "zod";

export const auditQuerySchema = z.object({
  tenantId: z.string().cuid().optional(),
  module: z.string().min(2).max(50).optional(),
  entityId: z.string().min(1).max(50).optional(),
  action: z.string().min(2).max(50).optional(),
  userId: z.string().cuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export function validateAuditQuery(query: any) {
  return auditQuerySchema.parse(query);
}

export const purgeAuditLogsSchema = z.object({
  days: z.number().int().positive().default(365),
});
export function validatePurgeAuditLogs(query: any) {
  return purgeAuditLogsSchema.parse(query);
}