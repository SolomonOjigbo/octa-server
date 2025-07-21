// src/modules/purchaseOrder/controllers/purchaseOrder.controller.ts

import { AppError } from "@common/constants/app.errors";
import { HttpStatusCode } from "@common/constants/http";

import { CancelPurchaseOrderDto, CreatePurchaseOrderDto, LinkPaymentDto, UpdatePurchaseOrderDto } from "../types/purchaseOrder.dto";
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { purchaseOrderService } from '../services/purchaseOrder.service';
import {
  CreatePurchaseOrderSchema,
  UpdatePurchaseOrderSchema,
  CancelPurchaseOrderSchema,
  LinkPaymentSchema,
} from '../validations';

export const purchaseOrderController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const data = await purchaseOrderService.list(tenantId);
    res.json(data);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const po = await purchaseOrderService.getById(tenantId, req.params.id);
    res.json(po);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    const dto      = CreatePurchaseOrderSchema.parse(req.body) as CreatePurchaseOrderDto;
    const rec      = await purchaseOrderService.create(tenantId, userId, dto);
    res.status(201).json(rec);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    const dto      = UpdatePurchaseOrderSchema.parse(req.body) as UpdatePurchaseOrderDto;
    const rec      = await purchaseOrderService.update(tenantId, userId, req.params.id, dto);
    res.json(rec);
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    const dto      = CancelPurchaseOrderSchema.parse(req.body) as CancelPurchaseOrderDto;
    const rec      = await purchaseOrderService.cancel(tenantId, userId, req.params.id, dto);
    res.json(rec);
  }),

  linkPayment: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    const dto      = LinkPaymentSchema.parse(req.body) as LinkPaymentDto;
    const rec      = await purchaseOrderService.linkPayment(tenantId, userId, req.params.id, dto);
    res.json(rec);
  }),
};
