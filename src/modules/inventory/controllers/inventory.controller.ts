// src/modules/inventory/controllers/inventory.controller.ts

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { inventoryService } from '../services/inventory.service';
import { InventoryMovementSchema } from '../validations';
import { InventoryMovementDto } from '../types/inventory.dto';

export const inventoryController = {
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

  createMovement: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    const dto      = InventoryMovementSchema.parse(req.body) as InventoryMovementDto;
    const rec      = await inventoryService.createMovement(tenantId, userId, dto);
    res.status(201).json(rec);
  }),

  updateMovement: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    const dto      = InventoryMovementSchema.partial().parse(req.body);
    const rec      = await inventoryService.updateMovement(tenantId, userId, req.params.id, dto);
    res.json(rec);
  }),

  deleteMovement: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    await inventoryService.deleteMovement(tenantId, userId, req.params.id);
    res.sendStatus(204);
  }),
};
