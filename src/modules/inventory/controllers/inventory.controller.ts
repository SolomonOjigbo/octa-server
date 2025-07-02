import { Request, Response } from "express";
import { inventoryService } from "../services/inventory.service";
import { 
  createInventoryMovementSchema,
  updateInventoryMovementSchema
} from "../validations";
import { 
  CreateInventoryMovementDto,
  UpdateInventoryMovementDto,
} from "../types/inventory.dto";
import { HttpStatusCode } from "@common/constants/http";
import { AppError } from "@common/constants/app.errors";
import { asyncHandler } from "@middleware/errorHandler";

import { NotFoundError, UnauthorizedError } from "@middleware/errors";
import { StockMovementType } from "@common/types/stockMovement.dto";

export class InventoryController {
  
  createMovement = asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    
    const validated = createInventoryMovementSchema.parse(req.body) as CreateInventoryMovementDto;
    const movement = await inventoryService.recordMovement({
      ...validated,
      userId: req.user.id
    } as any); // Cast to any or to the correct DTO type that matches the service signature
    
    res.status(HttpStatusCode.CREATED).json({
      success: true,
      data: movement
    });
  });

  getMovements = asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    
    const tenantId = req.query.tenantId as string;
    if (!tenantId) {
      throw new AppError('Tenant ID is required', HttpStatusCode.BAD_REQUEST);
    }

    const { 
      page, 
      limit,
      productId,
      variantId,
      storeId,
      warehouseId,
      movementType,
      startDate,
      endDate,
      reference,
      batchNumber
    } = req.query;

    const result = await inventoryService.getMovements(tenantId, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      productId: productId as string,
      variantId: variantId as string,
      storeId: storeId as string,
      warehouseId: warehouseId as string,
      movementType: movementType as string,
      startDate: startDate as string,
      endDate: endDate as string,
      reference: reference as string,
      batchNumber: batchNumber as string
    });

    res.json({
      success: true,
      ...result
    });
  });


  getMovementById = asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    
    const tenantId = req.query.tenantId as string;
    const { id } = req.params;
    
    if (!tenantId) {
      throw new AppError('Tenant ID is required', HttpStatusCode.BAD_REQUEST);
    }

    const movement = await inventoryService.getMovementById(tenantId, id);
    
    if (!movement) {
      throw new NotFoundError('Inventory movement');
    }

    res.json({
      success: true,
      data: movement
    });
  });

  updateMovement = asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    
    const tenantId = req.query.tenantId as string;
    const { id } = req.params;
    
    if (!tenantId) {
      throw new AppError('Tenant ID is required', HttpStatusCode.BAD_REQUEST);
    }

    const validated = updateInventoryMovementSchema.parse(req.body);
    // Ensure movementType is of type StockMovementType if present
    const updateData = {
      ...validated,
      movementType: validated.movementType as StockMovementType,
      expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : undefined
    };
    const movement = await inventoryService.updateMovement(
      tenantId, 
      id, 
      updateData
    );
    
    res.json({
      success: true,
      data: movement
    });
  });

  
  deleteMovement = asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    
    const tenantId = req.query.tenantId as string;
    const { id } = req.params;
    
    if (!tenantId) {
      throw new AppError('Tenant ID is required', HttpStatusCode.BAD_REQUEST);
    }

    await inventoryService.deleteMovement(tenantId, id);
    
    res.status(HttpStatusCode.NO_CONTENT).send();
  });

  updateInventoryMovement = asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    
    const tenantId = req.query.tenantId as string;
    const { id } = req.params;
    
    if (!tenantId) {
      throw new AppError('Tenant ID is required', HttpStatusCode.BAD_REQUEST);
    }

    const validated = updateInventoryMovementSchema.parse(req.body) as UpdateInventoryMovementDto;
    const updateData = {
      ...validated,
      expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : undefined
    };
    const movement = await inventoryService.updateMovement(
      tenantId, 
      id, 
      updateData
    );
    
    res.json({
      success: true,
      data: movement
    });
  });


}

export const inventoryController = new InventoryController();