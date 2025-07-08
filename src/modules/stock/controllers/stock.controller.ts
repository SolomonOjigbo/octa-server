// src/modules/stock/controllers/stock.controller.ts
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { stockService } from '../services/stock.service';
import { StockAdjustmentSchema } from '../validations';
import { StockLevelDto } from '../types/stock.dto';

export const stockController = {
  getStockLevels: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const data = await stockService.getStockLevels(tenantId);
    res.json(data);
  }),

  adjustStock: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    const dto      = StockAdjustmentSchema.parse(req.body) as StockLevelDto;
    const record   = await stockService.adjustStock(tenantId, userId, dto);
    res.status(201).json(record);
  }),

  incrementStock: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    const dto      = StockAdjustmentSchema.parse(req.body) as StockLevelDto;
    const record   = await stockService.incrementStock(tenantId, userId, dto);
    res.json(record);
  }),

  deleteStock: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    await stockService.deleteStock(tenantId, userId, req.params.id);
    res.sendStatus(204);
  }),
};
