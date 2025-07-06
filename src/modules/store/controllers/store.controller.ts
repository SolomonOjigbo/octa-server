// src/modules/store/controllers/store.controller.ts

import { Request, Response } from "express";
import { storeService } from "../services/store.service";
import { createStoreSchema, updateStoreSchema } from "../validations";
import { CreateStoreDto } from "../types/store.dto";

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
    const { id } = req.params;
    const store = await storeService.getStoreById(id);
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json(store);
  }

  async updateStore(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = updateStoreSchema.parse(req.body);
      const store = await storeService.updateStore(id, validated);
      res.json(store);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async deleteStore(req: Request, res: Response) {
    const { id } = req.params;
    const deleted = await storeService.deleteStore(id);
    if (!deleted) return res.status(404).json({ message: "Store not found" });
    res.status(204).send();
  }
}
export const storeController = new StoreController();
