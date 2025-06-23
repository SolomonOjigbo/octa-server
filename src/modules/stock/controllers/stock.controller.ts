import { Request, Response } from "express";
import { stockService } from "../services/stock.service";
import { adjustStockSchema, incrementStockSchema } from "../validations";
import { AdjustStockDto, IncrementStockDto } from "../types/stock.dto";

export class StockController {
  async getStockLevels(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const filters: any = {};
    if (req.query.storeId) filters.storeId = req.query.storeId as string;
    if (req.query.warehouseId) filters.warehouseId = req.query.warehouseId as string;
    if (req.query.productId) filters.productId = req.query.productId as string;
    const stocks = await stockService.getStockLevels(tenantId, filters);
    res.json(stocks);
  }

  async getStock(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const productId = req.params.productId;
    const storeId = req.query.storeId as string | undefined;
    const warehouseId = req.query.warehouseId as string | undefined;
    const stock = await stockService.getStock(tenantId, productId, storeId, warehouseId);
    if (!stock) return res.status(404).json({ message: "Stock record not found" });
    res.json(stock);
  }

  async adjustStockLevel(req: Request, res: Response) {
    try {
      const validated = adjustStockSchema.parse(req.body) as AdjustStockDto;
      const stock = await stockService.adjustStockLevel(validated);
      res.json(stock);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async incrementStockLevel(req: Request, res: Response) {
    try {
      const validated = incrementStockSchema.parse(req.body) as IncrementStockDto;
      const stock = await stockService.incrementStockLevel(validated);
      res.json(stock);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async deleteStock(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const productId = req.params.productId;
    const storeId = req.query.storeId as string | undefined;
    const warehouseId = req.query.warehouseId as string | undefined;
    const result = await stockService.deleteStock(tenantId, productId, storeId, warehouseId);
    if (result.count === 0) return res.status(404).json({ message: "Stock record not found" });
    res.status(204).send();
  }
}

export const stockController = new StockController();
