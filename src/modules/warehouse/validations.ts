import { z } from 'zod';
import { CreateWarehouseDtoSchema, UpdateWarehouseDtoSchema, WarehouseStatus } from './types/warehouse.dto';

export const createWarehouseSchema = CreateWarehouseDtoSchema.extend({
  tenantId: z.string().cuid(),
});

export const updateWarehouseSchema = UpdateWarehouseDtoSchema.extend({
  id: z.string().cuid(),
  tenantId: z.string().cuid(),
});

export const warehouseIdSchema = z.object({
  id: z.string().cuid(),
  tenantId: z.string().cuid(),
});

export const warehouseFiltersSchema = z.object({
  tenantId: z.string().cuid(),
  status: z.nativeEnum(WarehouseStatus),
  businessEntityId: z.string().cuid().optional(),
});