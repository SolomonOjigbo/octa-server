import { Request, Response } from "express";
import { stockTransferService } from "../services/stockTransfer.service";

export class StockTransferController {
  async createTransfer(req: Request, res: Response) {
    try {
      const transfer = await stockTransferService.createTransfer(req.body);
      res.status(201).json(transfer);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async approveTransfer(req: Request, res: Response) {
    try {
      const { transferId } = req.params;
      const { approvedBy } = req.body;
      const updatedTransfer = await stockTransferService.approveTransfer(transferId, approvedBy);
      res.json(updatedTransfer);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async rejectTransfer(req: Request, res: Response) {
    try {
      const { transferId } = req.params;
      const { rejectedBy, notes } = req.body;
      const transfer = await stockTransferService.rejectTransfer(transferId, rejectedBy, notes);
      res.json(transfer);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async cancelTransfer(req: Request, res: Response) {
    try {
      const { transferId } = req.params;
      const { cancelledBy, notes } = req.body;
      const transfer = await stockTransferService.cancelTransfer(transferId, cancelledBy, notes);
      res.json(transfer);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async listTransfers(req: Request, res: Response) {
    try {
      const filters = {
        tenantId: req.query.tenantId as string,
        toTenantId: req.query.toTenantId as string,
        status: req.query.status as string,
        storeId: req.query.storeId as string,
        productId: req.query.productId as string,
        transferType: req.query.transferType as string,
        limit: req.query.limit ? Number(req.query.limit) : 50,
        offset: req.query.offset ? Number(req.query.offset) : 0,
      };
      const transfers = await stockTransferService.listTransfers(filters);
      res.json(transfers);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async getTransferById(req: Request, res: Response) {
    try {
      const { transferId } = req.params;
      const transfer = await stockTransferService.getTransferById(transferId);
      if (!transfer) return res.status(404).json({ message: "Transfer not found" });
      res.json(transfer);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async deleteTransfer(req: Request, res: Response) {
    try {
      const { transferId } = req.params;
      await stockTransferService.deleteTransfer(transferId);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}

export const stockTransferController = new StockTransferController();
