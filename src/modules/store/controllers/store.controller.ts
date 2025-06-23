import { Request, Response } from "express";
import { StoreService } from "../services/store.service";

const storeService = new StoreService();

export const createStore = async (req: Request, res: Response) => {
  try {
    const store = await storeService.createStore(req.body);
    res.status(201).json(store);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getStoreById = async (req: Request, res: Response) => {
  try {
    const store = await storeService.getStoreById(req.params.id);
    if (!store) return res.status(404).json({ error: "Store not found" });
    res.json(store);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateStore = async (req: Request, res: Response) => {
  try {
    const store = await storeService.updateStore(req.params.id, req.body);
    res.json(store);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteStore = async (req: Request, res: Response) => {
  try {
    await storeService.deleteStore(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const listStoresByTenant = async (req: Request, res: Response) => {
  try {
    const stores = await storeService.listStoresByTenant(req.params.tenantId);
    res.json(stores);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
