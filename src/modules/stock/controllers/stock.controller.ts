// src/modules/stock/controllers/stock.controller.ts
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { stockService } from '../services/stock.service';
import { AdjustVariantStockDto} from '../types/stock.dto';
import { AdjustProductStockSchema, VariantStockAdjustmentSchema } from '../validations';

/**
 * Assumes requireAuth middleware has populated:
 *   req.user.sub         → the authenticated user’s ID
 *   req.user.tenantId    → the authenticated user’s tenant ID
 */
export class StockController {
  /**
   * GET /stocks
   * List all stock levels for the current tenant
   */
  async getStockLevels(req: Request, res: Response) {
    try {
      const { tenantId } = req.user;
      const levels = await stockService.getStockLevels(tenantId);
      res.json(levels);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  /**
   * POST /stocks
   * Adjust stock (increase or decrease) and record inventory movement
   */
  async adjustProductStock(req: Request, res: Response) {
    try {
      // 1. Validate and parse payload
      const dto = AdjustProductStockSchema.parse(req.body);

      // 2. Extract actor and tenant
      const userId = req.user.id;
      const tenantId = req.user.tenantId;

      // 3. Perform the adjustment
      const stock = await stockService.adjustStock(tenantId, userId, dto);

      // 4. Return the updated stock record
      res.status(201).json(stock);
    } catch (err: any) {
      // Zod validation errors end up in err.errors
      const message = err.errors ?? err.message;
      res.status(400).json({ message });
    }
  }
  async adjustVariantStock(req: Request, res: Response) {
    try {
      // 1. Validate and parse payload
      const dto = VariantStockAdjustmentSchema.parse(req.body) as AdjustVariantStockDto;

      // 2. Extract actor and tenant
      const userId = req.user.id;
      const tenantId = req.user.tenantId;

      // 3. Perform the adjustment
      const stock = await stockService.incrementVariantStock(tenantId, userId, dto);

      // 4. Return the updated stock record
      res.status(201).json(stock);
    } catch (err: any) {
      // Zod validation errors end up in err.errors
      const message = err.errors ?? err.message;
      res.status(400).json({ message });
    }
  }

  /**
   * DELETE /stocks/:id
   * Hard-delete a stock entry (admin only)
   */
  async deleteStock(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      // Perform deletion
      const deleted = await stockService.deleteStock(tenantId, userId, id);

      res.json(deleted);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}

export const stockController = new StockController();
