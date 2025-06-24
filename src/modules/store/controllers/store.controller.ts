import { Request, Response } from "express";
import { storeService } from "../services/store.service";
import { createStoreSchema, updateStoreSchema } from "../validations";
import { CreateStoreDto, UpdateStoreDto } from "../types/store.dto";

export class StoreController {
  async createStore(req: Request, res: Response) {
    try {
      const validated = createStoreSchema.parse(req.body) as CreateStoreDto;
      const store = await storeService.createStore(validated);
      res.status(201).json(store);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async getStores(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const stores = await storeService.getStores(tenantId);
    res.json(stores);
  }

  async getStoreById(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const { id } = req.params;
    const store = await storeService.getStoreById(tenantId, id);
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json(store);
  }

  async updateStore(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      const { id } = req.params;
      const validated = updateStoreSchema.parse(req.body) as UpdateStoreDto;
      const updated = await storeService.updateStore(tenantId, id, validated);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async deleteStore(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      const { id } = req.params;
      await storeService.deleteStore(tenantId, id);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }
}

export const storeController = new StoreController();
