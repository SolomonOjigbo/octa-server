// src/modules/invoice/controllers/invoice.controller.ts

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import {
  ListInvoicesQuerySchema,
  CreateInvoiceSchema,
  IssueInvoiceSchema,
  UpdateInvoiceSchema,
  ApplyPaymentSchema,
} from '../validations';
import { invoiceService } from '../services/invoice.service';
import { ApplyPaymentDto, CreateInvoiceDto, IssueInvoiceDto } from '../types/invoice.dto';
import { paymentService } from '@modules/payments/services/payment.service';

export const invoiceController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = ListInvoicesQuerySchema.parse(req.query);
    const data = await invoiceService.list(req.user!.tenantId, query);
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const dto = CreateInvoiceSchema.parse(req.body) as CreateInvoiceDto;
    const rec = await invoiceService.createDraft(req.user!.tenantId, req.user!.id, dto);
    res.status(201).json(rec);
  }),

  issue: asyncHandler(async (req: Request, res: Response) => {
    const dto = IssueInvoiceSchema.parse(req.body) as IssueInvoiceDto;
    const rec = await invoiceService.issue(req.user!.tenantId, req.user!.id, req.params.id, dto);
    res.json(rec);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const rec = await invoiceService.getById(req.user!.tenantId, req.params.id);
    res.json(rec);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const dto = UpdateInvoiceSchema.parse(req.body);
    const rec = await invoiceService.update(req.user!.tenantId, req.user!.id, req.params.id, dto);
    res.json(rec);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await invoiceService.delete(req.user!.tenantId, req.user!.id, req.params.id);
    res.sendStatus(204);
  }),

  applyPayment: asyncHandler(async (req: Request, res: Response) => {
    const dto = ApplyPaymentSchema.parse(req.body) as ApplyPaymentDto;
    const rec = await invoiceService.applyPayment(req.user!.tenantId, req.user!.id, req.params.id, dto);
    res.json(rec);
  }),

    applyInvoicePayment: asyncHandler(async(req: Request, res: Response) =>{
  try {
    const payment = await invoiceService.createPaymentAndApplyToInvoice(req.body);
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}),


  getPdf: asyncHandler(async (req: Request, res: Response) => {
    const pdf = await invoiceService.getPdf(req.user!.tenantId, req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  }),
};
