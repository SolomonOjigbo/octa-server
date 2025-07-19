// src/modules/pos/controllers/posReceipt.controller.ts

import { Request, Response } from "express";
import { posReceiptService } from "../services/posReceipt.service";

export class PosReceiptController {
  async getReceipt(req: Request, res: Response) {
    const transactionId = req.params.transactionId;
    const tenantId = req.user?.tenantId;

    try {
      const receipt = await posReceiptService.getReceipt(tenantId, transactionId);
      return res.status(200).json(receipt);
    } catch (err) {
      return res.status(404).json({ error: err.message });
    }
  }

async getReceiptPDF(req: Request, res: Response) {
  const { transactionId } = req.params;
  const tenantId = req.user!.tenantId;
  try {
    await posReceiptService.streamPDFReceipt(tenantId, transactionId, res);
  } catch (err) {
    return res.status(404).json({ error: err.message });
  }
}


};
export const posReceiptController = new PosReceiptController
