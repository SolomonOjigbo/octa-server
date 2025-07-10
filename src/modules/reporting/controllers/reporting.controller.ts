import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import {
  DateRangeSchema,
  InventoryReportSchema,
} from '../validations';
import { reportingService } from '../services/reporting.service';

export const reportingController = {
  salesSummary: asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, groupBy } = DateRangeSchema.parse(req.query);
    const data = await reportingService.salesSummary(
      req.user!.tenantId, startDate, endDate, groupBy
    );
    res.json(data);
  }),

  inventoryStatus: asyncHandler(async (req: Request, res: Response) => {
    const { belowReorder } = InventoryReportSchema.parse(req.query);
    const data = await reportingService.inventoryStatus(
      req.user!.tenantId, belowReorder
    );
    res.json(data);
  }),

  purchaseOrderStatus: asyncHandler(async (req: Request, res: Response) => {
    const data = await reportingService.purchaseOrderStatus(req.user!.tenantId);
    res.json(data);
  }),

  transactionTypes: asyncHandler(async (req: Request, res: Response) => {
    const data = await reportingService.transactionTypes(req.user!.tenantId);
    res.json(data);
  }),

  paymentMethods: asyncHandler(async (req: Request, res: Response) => {
    const data = await reportingService.paymentMethods(req.user!.tenantId);
    res.json(data);
  }),

  b2bConnections: asyncHandler(async (req: Request, res: Response) => {
    const data = await reportingService.b2bConnections(req.user!.tenantId);
    res.json(data);
  }),
};
