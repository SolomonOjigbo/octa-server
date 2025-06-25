import { Request, Response } from "express";
import { reportingService } from "../services/reporting.service";

export class ReportingController {
  async getSalesSummary(req: Request, res: Response) {
    const { tenantId, userId, dateFrom, dateTo } = req.query;
    const summary = await reportingService.getSalesSummary({
      tenantId: tenantId as string,
      userId: userId as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
    });
    res.json(summary);
  }

  async getDailySales(req: Request, res: Response) {
    const { tenantId, storeId, dateFrom, dateTo } = req.query;
    const daily = await reportingService.getDailySales({
      tenantId: tenantId as string,
      storeId: storeId as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
    });
    res.json(daily);
  }
}

export const reportingController = new ReportingController();
