import { Request, Response } from 'express';
import { warehouseService } from '../services/warehouse.service';
import { 
  createWarehouseSchema,
  updateWarehouseSchema,
  warehouseIdSchema,
  warehouseFiltersSchema 
} from '../validations';
import { auditService } from '@modules/audit/services/audit.service';
import { validate } from '@middleware/validate';
import { CreateWarehouseDtoSchema, UpdateWarehouseDtoSchema } from '../types/warehouse.dto';

export class WarehouseController {
  async create(req: Request, res: Response) {
    const { tenantId} = req.user!;
    const userId = req.user!.id;
    const dto = createWarehouseSchema.parse(req.body);
    
    const warehouse = await warehouseService.create(tenantId, userId, dto);
    
    await auditService.log({
      tenantId,
      userId,
      module: 'Warehouse',
      action: 'create',
      entityId: warehouse.id,
      details: dto,
    });

    res.status(201).json(warehouse);
  }

  async update(req: Request, res: Response) {
    const { tenantId} = req.user!;
    const userId = req.user!.id;
    const { id } =  req.params;
    const dto = updateWarehouseSchema.parse(req.body);
    
    const warehouse = await warehouseService.update(tenantId, userId, id, dto);
    
    await auditService.log({
      tenantId,
      userId,
      module: 'Warehouse',
      action: 'update',
      entityId: id,
      details: dto,
    });

    res.json(warehouse);
  }

  async getById(req: Request, res: Response) {
    const { tenantId } = req.user!;
    const { id } = warehouseIdSchema.parse(req.params);
    
    const warehouse = await warehouseService.getById(tenantId, id);
    res.json(warehouse);
  }

  async list(req: Request, res: Response) {
    const { tenantId } = req.user!;
    const filters = warehouseFiltersSchema.parse(req.query);
    
    const warehouses = await warehouseService.list(tenantId, filters);
    res.json(warehouses);
  }

  async delete(req: Request, res: Response) {
    const { tenantId} = req.user!;
    const userId = req.user!.id;
     const { id } = warehouseIdSchema.parse(req.params);
    
    await warehouseService.delete(tenantId, userId, id);
    
    await auditService.log({
      tenantId,
      userId,
      module: 'Warehouse',
      action: 'delete',
      entityId: id,
    });

    res.status(204).send();
  }
}

export const warehouseController = new WarehouseController();