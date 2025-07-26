// src/modules/inventory/controllers/inventory.controller.ts

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { inventoryService } from '../services/inventory.service';
import { InventoryMovementSchema, VoidInventoryMovementSchema } from '../validations';
import { InventoryMovementDto } from '../types/inventory.dto';

export const inventoryController = {

  createMovement: asyncHandler(async (req: Request, res: Response) => {
    try {
      const dto = InventoryMovementSchema.parse(req.body) as InventoryMovementDto;
      const userId = req.user?.id;
      const tenantId = req.user?.tenantId;
      const movement = await inventoryService.createMovement(tenantId, userId, dto);
     res.status(201).json(movement); 
    } catch (error) {
      res.status(400).json({ message: error.message });
      
    }

}),

  getMovements: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const data = await inventoryService.getMovements(tenantId);
    res.json(data);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const rec = await inventoryService.getById(tenantId, req.params.id);
    res.json(rec);
  }),

  searchMovements: asyncHandler(async (req: Request, res: Response) => {

    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id
    const {
       tenantProductId,
        variantId,
        storeId,
        warehouseId,
        startDate,
        endDate,
        movementType,
        voided,
          } = req.body;
        const data = await inventoryService.searchMovements(tenantId, {    tenantProductId,
        storeId,
        warehouseId,
        startDate,
        endDate,
        movementType,
        voided,
      });
      res.status(200).json(data);
    } catch (error) {
      
    }
    
}),

  updateMovement: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    const dto      = InventoryMovementSchema.parse(req.body);
    const rec      = await inventoryService.updateMovement(tenantId, userId, req.params.id, dto);
    res.json(rec);
  }),

    voidMovement: asyncHandler(async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const userId   = req.user!.id;
      const {reason, id} = VoidInventoryMovementSchema.partial().parse(req.body);
      await inventoryService.voidInventoryMovement(tenantId, userId, id, reason);
      res.sendStatus(204);
      
    } catch (error) {

      
    }

  }),

  deleteMovement: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    await inventoryService.deleteMovement(tenantId, userId, req.params.id);
    res.sendStatus(204);
  }),
};
