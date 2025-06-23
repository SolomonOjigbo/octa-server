import { Request, Response } from "express";
import { InventoryService } from "../services/inventory.service";

const inventoryService = new InventoryService();

export const createInventory = async (req: Request, res: Response) => {
  try {
    const inventory = await inventoryService.createInventory(req.body);
    res.status(201).json(inventory);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getInventoryById = async (req: Request, res: Response) => {
  try {
    const inventory = await inventoryService.getInventoryById(req.params.id);
    if (!inventory) return res.status(404).json({ error: "Inventory not found" });
    res.json(inventory);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateInventory = async (req: Request, res: Response) => {
  try {
    const inventory = await inventoryService.updateInventory(req.params.id, req.body);
    res.json(inventory);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteInventory = async (req: Request, res: Response) => {
  try {
    await inventoryService.deleteInventory(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const listInventoryByStore = async (req: Request, res: Response) => {
  try {
    const inventory = await inventoryService.listInventoryByStore(req.params.storeId);
    res.json(inventory);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
