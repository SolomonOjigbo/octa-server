// src/modules/pos/controllers/pos.controller.ts

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import {
  OpenSessionSchema,
  CloseSessionSchema,
  CreateTransactionSchema,
  CreatePaymentSchema,
  CreateSalesReturnSchema,
  CreateCashDropSchema,
  ReconcileCashSchema,
} from '../validations';
import { posService } from '../services/pos.service';
import { CloseSessionDto, CreateCashDropDto, CreatePaymentDto, CreateSalesReturnDto, CreateTransactionDto, OpenSessionDto, ReconcileCashDto } from '../types/pos.dto';

export const posController = {
  openSession: asyncHandler(async (req: Request, res: Response) => {
    const dto = OpenSessionSchema.parse(req.body) as OpenSessionDto;
    const session = await posService.createPOSSession(req.user!.tenantId, req.user!.id, dto);
    res.status(201).json(session);
  }),

  closeSession: asyncHandler(async (req: Request, res: Response) => {
    const dto = CloseSessionSchema.parse(req.body) as CloseSessionDto;
    const session = await posService.closePOSSession(req.user!.tenantId, dto);
    res.json(session);
  }),

  getSessionSummary: asyncHandler(async (req, res) => {
    const summary = await posService.getSessionSummary(req.user!.tenantId, req.params.sessionId);
    res.json(summary);
  }),

  createTransaction: asyncHandler(async (req, res) => {
    const dto = CreateTransactionSchema.parse(req.body) as CreateTransactionDto;
    const tx = await posService.createTransaction(req.user!.tenantId, req.user!.id, dto);
    res.status(201).json(tx);
  }),

  createPayment: asyncHandler(async (req, res) => {
    const dto = CreatePaymentSchema.parse(req.body) as CreatePaymentDto;
    const p = await posService.createPayment(req.user!.tenantId, req.user!.id, dto);
    res.status(201).json(p);
  }),

  createSalesReturn: asyncHandler(async (req, res) => {
    const dto = CreateSalesReturnSchema.parse(req.body) as CreateSalesReturnDto;
    const ret = await posService.createSalesReturn(req.user!.tenantId, req.user!.id, dto);
    res.status(201).json(ret);
  }),

  createCashDrop: asyncHandler(async (req, res) => {
    const dto = CreateCashDropSchema.parse(req.body) as CreateCashDropDto;
    const drop = await posService.createCashDrop(req.user!.tenantId, req.user!.id, dto);
    res.status(201).json(drop);
  }),

  reconcileCash: asyncHandler(async (req, res) => {
    const dto = ReconcileCashSchema.parse(req.body) as ReconcileCashDto;
    const rec = await posService.reconcileCash(req.user!.tenantId, req.user!.id, dto);
    res.status(201).json(rec);
  }),

  /**
   * @route POST /pos/sale
   * @desc Create a new POS transaction (sale)
   */
  async createSale(req: Request, res: Response) {
    const userId = req.user?.id;
    const tenantId = req.user.tenantId;

    const dto = CreateTransactionSchema.parse(req.body) as CreateTransactionDto;

    const transaction = await posService.createTransaction(
      tenantId,
      userId,
      dto
    );

    return res.status(201).json(transaction);
  },

  /**
   * @route POST /pos/return
   * @desc Process a return for a past sale
   */
  async createReturn(req: Request, res: Response) {
    const userId = req.user?.id;
    const tenantId = req.user.tenantId;

    const dto = CreateTransactionSchema.parse(req.body) as CreateSalesReturnDto;
    // if (!parsed.success) {
    //   return res.status(400).json({ error: parsed.error.errors });
    // }

    const transaction = await posService.createSalesReturn(
      tenantId,
      userId,
      dto,
    );

    return res.status(201).json(transaction);
  },
};

