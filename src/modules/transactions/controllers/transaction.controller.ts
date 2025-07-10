import { Request, Response } from "express";
import { transactionService } from "../services/transaction.service";
import { CreateTransactionSchema, getTransactionFiltersSchema, UpdateTransactionSchema, updateTransactionStatusSchema } from "../validations";
import { GetTransactionFilters, UpdateTransactionStatusDto } from "../types/transaction.dto";
import { asyncHandler } from "@middleware/errorHandler";

export class TransactionController {

  //Get transactions
  list = asyncHandler(async (req: Request, res: Response) => {
    const data = await transactionService.list(req.user!.tenantId);
    res.json(data);
  });

//Search transactions
  async searchTransactions(req: Request, res: Response) {
    const filters = getTransactionFiltersSchema.parse(req.query) as GetTransactionFilters;
    const transactions = await transactionService.getTransactions(filters);
    res.json(transactions);
  }

  getById = asyncHandler(async (req: Request, res: Response) => {
     const { id } = req.params;
    const tenantId = req.user?.tenantId as string;

    const rec = await transactionService.getById(
     tenantId,
     id
    );
    res.json(rec);
  });

  async getTransactionById(req: Request, res: Response) {
    const { id } = req.params;
    const tenantId = req.user?.tenantId as string;
    const txn = await transactionService.getById(tenantId, id);
    if (!txn) return res.status(404).json({ message: "Transaction not found" });
    res.json(txn);
  }

  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = CreateTransactionSchema.parse(req.body);
    const rec = await transactionService.createTransaction(
      req.user!.tenantId,
      req.user!.id,
      dto
    );
    res.status(201).json(rec);
  });

   update = asyncHandler(async (req: Request, res: Response) => {
    const dto = UpdateTransactionSchema.parse(req.body);
    const rec = await transactionService.update(
      req.user!.tenantId,
      req.user!.id,
      req.params.id,
      dto
    );
    res.json(rec);
  });
  

  delete = asyncHandler(async (req: Request, res: Response) => {
    await transactionService.delete(
      req.user!.tenantId,
      req.user!.id,
      req.params.id
    );
    res.sendStatus(204);
  });

}

export const transactionController = new TransactionController();
