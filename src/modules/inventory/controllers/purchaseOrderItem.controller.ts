import { Request, Response } from "express";
import { PurchaseOrderItemService } from "../services/purchaseOrderItem.service";

const orderItemService = new PurchaseOrderItemService();

export const createOrderItem = async (req: Request, res: Response) => {
  try {
    const item = await orderItemService.createOrderItem(req.body);
    res.status(201).json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getOrderItemById = async (req: Request, res: Response) => {
  try {
    const item = await orderItemService.getOrderItemById(req.params.id);
    if (!item) return res.status(404).json({ error: "Order item not found" });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateOrderItem = async (req: Request, res: Response) => {
  try {
    const item = await orderItemService.updateOrderItem(req.params.id, req.body);
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteOrderItem = async (req: Request, res: Response) => {
  try {
    await orderItemService.deleteOrderItem(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const listItemsByPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const items = await orderItemService.listItemsByPurchaseOrder(req.params.purchaseOrderId);
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
