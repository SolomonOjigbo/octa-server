import { Request, Response } from "express";
import { inventoryService } from "../services/inventory.service";
import {
  createInventoryMovementSchema,
  updateInventoryMovementSchema,
} from "../validations";
import { CreateInventoryMovementDto } from "../types/inventory.dto";

export class InventoryController {
  async createMovement(req: Request, res: Response) {
    try {
      const validated = createInventoryMovementSchema.parse(req.body) as CreateInventoryMovementDto;
      const movement = await inventoryService.createMovement(validated);
      res.status(201).json(movement);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async getMovements(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const filters = {
      productId: req.query.productId as string,
      storeId: req.query.storeId as string,
      warehouseId: req.query.warehouseId as string,
      movementType: req.query.movementType as string,
    };
    const movements = await inventoryService.getMovements(tenantId, filters);
    res.json(movements);
  }

  async getMovementById(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const { id } = req.params;
    const movement = await inventoryService.getMovementById(tenantId, id);
    if (!movement) return res.status(404).json({ message: "Movement not found" });
    res.json(movement);
  }

  async updateMovement(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      const { id } = req.params;
      const validated = updateInventoryMovementSchema.parse(req.body);
      const result = await inventoryService.updateMovement(tenantId, id, validated);
      if (result.count === 0) return res.status(404).json({ message: "Movement not found" });
      res.json({ message: "Movement updated" });
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async deleteMovement(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const { id } = req.params;
    const result = await inventoryService.deleteMovement(tenantId, id);
    if (result.count === 0) return res.status(404).json({ message: "Movement not found" });
    res.status(204).send();
  }
}

export const inventoryController = new InventoryController();
