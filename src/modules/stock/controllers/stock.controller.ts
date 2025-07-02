// src/modules/stock/controllers/stock.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  StockLevelDto,
  StockResponseDto,
  StockAdjustmentDto,
  StockIncrementDto,
  AdjustStockDto,
  IncrementStockDto,
} from "../types/stock.dto";
import { asyncHandler, UnauthorizedError } from "@middleware/errorHandler";
import { NotFoundError } from "@middleware/errors";
import { AppError } from "@common/constants/app.errors";
import { stockService, StockService } from "../services/stock.service";
import { HttpStatusCode } from "@common/constants/http";
import { StockAdjustmentSchema, StockIncrementSchema } from "../validations";

export class StockController {

  getStockLevels = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.query.tenantId as string;
    const filters = {
      productId: req.query.productId as string,
      variantId: req.query.variantId as string,
      storeId: req.query.storeId as string,
      warehouseId: req.query.warehouseId as string,
      minQuantity: req.query.minQuantity ? Number(req.query.minQuantity) : undefined,
      maxQuantity: req.query.maxQuantity ? Number(req.query.maxQuantity) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    };

    const result = await stockService.getStockLevels(tenantId, filters);
    res.json({ success: true, ...result });
  });

  getStock = asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    
    const tenantId = req.query.tenantId as string;
    const productId = req.params.productId;
    
    if (!tenantId) {
      throw new AppError('Tenant ID is required', HttpStatusCode.BAD_REQUEST);
    }

    const { variantId, storeId, warehouseId } = req.query;
    const stock = await stockService.getStock(tenantId, productId, {
      variantId: variantId as string,
      storeId: storeId as string,
      warehouseId: warehouseId as string
    });

    if (!stock) {
      throw new NotFoundError('Stock record');
    }

    res.json({
      success: true,
      data: stock
    });
  });


  adjustStockLevel = asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    
    const validated = StockAdjustmentSchema.parse(req.body) as AdjustStockDto;
    const stock = await stockService.adjustStockLevel(validated, req.user.id);
    
    res.json({
      success: true,
      data: stock
    });
  });


  incrementStockLevel = asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    
    const validated = StockIncrementSchema.parse(req.body) as IncrementStockDto;
    const stock = await stockService.incrementStockLevel(validated, req.user.id);
    
    res.json({
      success: true,
      data: stock
    });
  });

  deleteStock = asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    
    const tenantId = req.query.tenantId as string;
    const productId = req.params.productId;
    
    if (!tenantId) {
      throw new AppError('Tenant ID is required', HttpStatusCode.BAD_REQUEST);
    }

    const { storeId, warehouseId } = req.query;
    await stockService.deleteStock(
      tenantId, 
      productId, 
      {
        storeId: storeId as string,
        warehouseId: warehouseId as string
      },
      req.user.id
    );
    
    res.status(HttpStatusCode.NO_CONTENT).send();
  });

}

export const stockController = new StockController();