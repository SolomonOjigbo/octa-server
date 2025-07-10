import { z } from 'zod';

export const DateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate:   z.coerce.date().optional(),
  groupBy:   z.enum(['day','week','month']).default('day'),
});

export const InventoryReportSchema = z.object({
  belowReorder: z.boolean().optional().default(false),
});

export const EmptySchema = z.object({});
