import { Request, Response } from "express";
import { purchaseOrderService } from "../services/purchaseOrder.service";
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  cancelPurchaseOrderSchema,
  linkPaymentSchema,
} from "../validations";
import { CancelPurchaseOrderDto, CreatePurchaseOrderDto, LinkPaymentDto } from "../types/purchaseOrder.dto";

export class PurchaseOrderController {
  async createPurchaseOrder(req: Request, res: Response) {
    try {
      const validated = createPurchaseOrderSchema.parse(req.body) as CreatePurchaseOrderDto;
      const po = await purchaseOrderService.createPurchaseOrder(validated);
      res.status(201).json(po);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async updatePurchaseOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = updatePurchaseOrderSchema.parse(req.body);
      const po = await purchaseOrderService.updatePurchaseOrder(id, validated);
      if (!po) return res.status(404).json({ message: "Not found" });
      res.json(po);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async cancelPurchaseOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = cancelPurchaseOrderSchema.parse(req.body)as CancelPurchaseOrderDto;
      const po = await purchaseOrderService.cancelPurchaseOrder(id, validated);
      if (!po) return res.status(404).json({ message: "Not found" });
      res.json({ message: "Purchase Order Cancelled", po });
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async receivePurchaseOrder(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      const { id } = req.params;
      const userId = req.body.userId as string;
      const po = await purchaseOrderService.receivePurchaseOrder(tenantId, id, userId);
      res.json(po);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async linkPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = linkPaymentSchema.parse(req.body) as LinkPaymentDto;
      const po = await purchaseOrderService.linkPayment(id, validated);
      res.json(po);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async getPurchaseOrders(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const pos = await purchaseOrderService.getPurchaseOrders(tenantId);
    res.json(pos);
  }
  async getPurchaseOrderById(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const { id } = req.params;
    const po = await purchaseOrderService.getPurchaseOrderById(tenantId, id);
    if (!po) return res.status(404).json({ message: "Not found" });
    res.json(po);
  }
}
export const purchaseOrderController = new PurchaseOrderController();
