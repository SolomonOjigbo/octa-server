// modules/stockTransfer/controllers/stockTransfer.controller.ts
import { Request, Response } from "express";
import { stockTransferService } from "../services/stockTransfer.service";
import { 
  createStockTransferSchema,
  approveStockTransferSchema,
  rejectStockTransferSchema,
  cancelStockTransferSchema,
  listStockTransfersSchema
} from "../validations";
import { asyncHandler } from "@middleware/errorHandler";
import { AppError } from "@common/constants/app.errors";
import { HttpStatusCode } from "@common/constants/http";
import { ApproveStockTransferDto, CancelStockTransferDto, CreateStockTransferDto, RejectStockTransferDto } from "../types/stockTransfer.dto";

export class StockTransferController {
 
  async createTransfer(req: Request, res: Response) {
    const validated = createStockTransferSchema.parse(req.body) as CreateStockTransferDto;
    const tenantId = req.user?.tenantId;
  const userId = req.user?.id;

  if (!tenantId || !userId) {
    return res.status(HttpStatusCode.UNAUTHORIZED).json({ error: 'Unauthorized' });
  }

  const transfer = await stockTransferService.createTransfer({
    ...validated,
    tenantId,
    requestedBy: userId,
  });
    if (!transfer) {
      throw new AppError('Failed to create stock transfer', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
    res.status(HttpStatusCode.CREATED).json({
      success: true,
      data: transfer
    });
  }

  async approveTransfer(req: Request, res: Response) {
    const id = req.params.id;
  const userId = req.user?.id;
  const tenantId = req.user?.tenantId;

  if (!tenantId || !userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
    const validated = approveStockTransferSchema.parse(req.body) as ApproveStockTransferDto;
    const transfer = await stockTransferService.approveTransfer(id, validated);
    res.json({
      success: true,
      data: transfer
    });
  }


  async rejectTransfer(req: Request, res: Response) {
     const id = req.params.id;
  const userId = req.user?.id;
  const tenantId = req.user?.tenantId;

  if (!tenantId || !userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
    const validated = rejectStockTransferSchema.parse(req.body) as RejectStockTransferDto;
    const transfer = await stockTransferService.rejectTransfer(id, validated);
    res.json({
      success: true,
      data: transfer
    });
  }

 
  async cancelTransfer(req: Request, res: Response) {
     const id = req.params.id;
      const userId = req.user?.id;
      const tenantId = req.user?.tenantId;

        if (!tenantId || !userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
    const validated = cancelStockTransferSchema.parse(req.body) as CancelStockTransferDto;
    const transfer = await stockTransferService.cancelTransfer(id, validated);
    res.json({
      success: true,
      data: transfer
    });
  }


  async listTransfers(req: Request, res: Response) {
    const filters = listStockTransfersSchema.parse({
      ...req.query,
      tenantId: req.user?.tenantId,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined
    });

    // If your service expects Date objects, create new variables for them
    let fromDate: Date | undefined = undefined;
    let toDate: Date | undefined = undefined;
    if (filters.fromDate && typeof filters.fromDate === 'string') {
      fromDate = new Date(filters.fromDate);
    }
    if (filters.toDate && typeof filters.toDate === 'string') {
      toDate = new Date(filters.toDate);
    }

    const result = await stockTransferService.listTransfers({
      ...filters,
      fromDate,
      toDate
    });
    res.json({
      success: true,
      ...result
    });
  }


  async getTransferById(req: Request, res: Response) {
    const { transferId } = req.params;
    const transfer = await stockTransferService.getTransferById(transferId);
    
    if (!transfer) {
      throw new AppError('Transfer not found', HttpStatusCode.NOT_FOUND);
    }
    
    res.json({
      success: true,
      data: transfer
    });
  }

  async deleteTransfer(req: Request, res: Response) {
    const { transferId } = req.params;
    await stockTransferService.deleteTransfer(transferId);
    res.status(HttpStatusCode.NO_CONTENT).send();
  }

  // Additional endpoints for pharmacy-specific features
  async createControlledSubstanceTransfer(req: Request, res: Response) {
    // Special handling for controlled substances
    const baseData = createStockTransferSchema.parse(req.body) as CreateStockTransferDto;

    // Additional validation for controlled substances
    if (!baseData.batchNumber || !baseData.expiryDate) {
      throw new AppError('Batch number and expiry date required for controlled substances', HttpStatusCode.BAD_REQUEST);
    }

    // Ensure tenantId and productId are present as required by CreateStockTransferDto
    if (!baseData.productId) {
      throw new AppError('Product ID is required for controlled substances', HttpStatusCode.BAD_REQUEST);
    }
    const dto: CreateStockTransferDto = {
      ...baseData,
      tenantId: req.user?.tenantId,
      productId: baseData.productId,
      expiryDate: baseData.expiryDate ? new Date(baseData.expiryDate) : undefined
    };

    const transfer = await stockTransferService.createTransfer(dto);
    res.status(HttpStatusCode.CREATED).json({
      success: true,
      data: transfer
    });
  }

  async listPendingTransfers(req: Request, res: Response) {
    const filters = listStockTransfersSchema.parse({
      ...req.query,
      status: 'pending',
      tenantId: req.user?.tenantId,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined
    });

    let fromDate: Date | undefined = undefined;
    let toDate: Date | undefined = undefined;
    if (filters.fromDate && typeof filters.fromDate === 'string') {
      fromDate = new Date(filters.fromDate);
    }
    if (filters.toDate && typeof filters.toDate === 'string') {
      toDate = new Date(filters.toDate);
    }

    const result = await stockTransferService.listTransfers({
      ...filters,
      fromDate,
      toDate
    });
    res.json({
      success: true,
      ...result
    });
  }
}

export const stockTransferController = new StockTransferController();