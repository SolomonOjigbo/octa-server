// controllers/reconciliation.controller.ts
import { Request, Response } from 'express';
import { reconciliationService } from '../services/reconciliation.service';
import { asyncHandler } from '@middleware/errorHandler';


export class ReconciliationController {
  reconcileInvoice = asyncHandler(async (req: Request, res: Response) => {
    const { invoiceId } = req.params;
    const result = await reconciliationService.reconcileTransactionWithStock(invoiceId);
    res.status(200).json({ message: 'Invoice reconciled', result });
  });

  reconcilePayment = asyncHandler(async (req: Request, res: Response) => {
    const { paymentId } = req.params;
    const result = await reconciliationService.reconcileInvoicePayment(paymentId);
    res.status(200).json({ message: 'Payment reconciled', result });
  });

  reconcileStockTransfer = asyncHandler(async (req: Request, res: Response) => {
    const { stockTransferId } = req.params;
    const result = await reconciliationService.reconcileStockTransfer(stockTransferId);
    res.status(200).json({ message: 'Stock Transfer reconciled', result });
  });

  reconcileTransaction = asyncHandler(async (req: Request, res: Response) => {
    const { transactionId } = req.params;
    const result = await reconciliationService.reconcileTransactionInventory(transactionId);
    res.status(200).json({ message: 'Transaction reconciled', result });
  });
}

export const reconciliationController = new ReconciliationController();
