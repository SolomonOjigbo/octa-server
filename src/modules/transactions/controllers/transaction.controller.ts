import { Request, Response } from "express";
import { transactionService } from "../services/transaction.service";
import { getTransactionFiltersSchema, updateTransactionStatusSchema } from "../validations";
import { GetTransactionFilters, UpdateTransactionStatusDto } from "../types/transaction.dto";

export class TransactionController {
  async getTransactions(req: Request, res: Response) {
    const filters = getTransactionFiltersSchema.parse(req.query) as GetTransactionFilters;
    const transactions = await transactionService.getTransactions(filters);
    res.json(transactions);
  }

  async getTransactionById(req: Request, res: Response) {
    const { id } = req.params;
    const tenantId = req.query.tenantId as string;
    const txn = await transactionService.getTransactionById(tenantId, id);
    if (!txn) return res.status(404).json({ message: "Transaction not found" });
    res.json(txn);
  }

  async updateTransactionStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = updateTransactionStatusSchema.parse(req.body) as UpdateTransactionStatusDto;
      const txn = await transactionService.updateTransactionStatus(id, validated);
      res.json(txn);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }
}

export const transactionController = new TransactionController();
