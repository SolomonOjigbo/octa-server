import { NextFunction, Request, Response } from "express";
import { crmReportingService } from "../services/crmReporting.service";

export class CRMReportingController {

public async getCustomerSummaryReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customerId } = req.params;

      // 1. Validate input
      if (!customerId) {
        // This check is often redundant if your route is '/:customerId' but is good practice.
        res.status(400).json({ success: false, message: 'Customer ID is required in the URL parameters.' });
        return;
      }

      // 2. Call the service layer
      const summary = await crmReportingService.getCustomerSummary(customerId);

      // 3. Handle "Not Found" case
      // The service method will return a summary object where the `customer` property is null if not found.
      if (!summary.customer) {
        res.status(404).json({ success: false, message: `Customer with ID '${customerId}' not found.` });
        return;
      }
      
      // 4. Send successful response
      res.status(200).json({
        success: true,
        data: summary,
      });

    } catch (error) {
      // 5. Pass any unexpected errors to the global error handler middleware
      console.error(`[CRMReportingController] Error fetching customer summary:`, error);
      next(error); // This delegates error handling to a dedicated middleware
    }
  }

  async getTopCustomers(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const limit = parseInt(req.query.limit as string) || 10;
    const topCustomers = await crmReportingService.getTopCustomers({ tenantId, limit });
    res.json(topCustomers);
  }

  async getCustomerPurchaseFrequency(req: Request, res: Response) {
    const { customerId } = req.params;
    const freq = await crmReportingService.getCustomerPurchaseFrequency(customerId);
    res.json(freq);
  }

  async getCustomersWithOutstanding(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const customers = await crmReportingService.getCustomersWithOutstanding({ tenantId });
    res.json(customers);
  }
}
export const crmReportingController = new CRMReportingController();
