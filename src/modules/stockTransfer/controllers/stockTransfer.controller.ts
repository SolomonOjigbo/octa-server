// src/modules/stockTransfer/controllers/stockTransfer.controller.ts

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { stockTransferService } from '../services/stockTransfer.service';
import {
  CreateStockTransferSchema,
  ApproveStockTransferSchema,
  RejectStockTransferSchema,
  CancelStockTransferSchema,
} from '../validations';
import { ApproveStockTransferDto, CreateStockTransferDto } from '../types/stockTransfer.dto';

export const stockTransferController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    res.json(await stockTransferService.list(tenantId));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    res.json(await stockTransferService.getById(tenantId, req.params.id));
  }),

  requestTransfer: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    const dto      = CreateStockTransferSchema.parse(req.body) as CreateStockTransferDto;
    const rec      = await stockTransferService.requestTransfer(tenantId, userId, dto);
    res.status(201).json(rec);
  }),

  approve: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    const dto      = ApproveStockTransferSchema.parse(req.body) as ApproveStockTransferDto;
    const rec      = await stockTransferService.approveTransfer(tenantId, userId, req.params.id, dto);
    res.json(rec);
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    const dto      = RejectStockTransferSchema.parse(req.body);
    const rec      = await stockTransferService.rejectTransfer(tenantId, userId, req.params.id, dto);
    res.json(rec);
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    const dto      = CancelStockTransferSchema.parse(req.body);
    const rec      = await stockTransferService.cancelTransfer(tenantId, userId, req.params.id, dto);
    res.json(rec);
  }),
};