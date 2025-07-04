// modules/purchaseOrder/controllers/purchaseOrder.controller.ts
import { Request, Response } from "express";
import { purchaseOrderService } from "../services/purchaseOrder.service";

import { asyncHandler } from "@middleware/errorHandler";
import { AppError } from "@common/constants/app.errors";
import { HttpStatusCode } from "@common/constants/http";
import { CancelPurchaseOrderSchema, CreateControlledSubstanceSchema, CreatePurchaseOrderSchema, LinkPaymentSchema, UpdatePurchaseOrderSchema } from "../validations";
import { CancelPurchaseOrderDto, CreateControlledSubstanceOrderDto, CreatePurchaseOrderDto, LinkPaymentDto, ListPendingOrdersDto, UpdatePurchaseOrderDto } from "../types/purchaseOrder.dto";



export class PurchaseOrderController {
 
  async createPurchaseOrder(req: Request, res: Response) {
    const parsed = CreatePurchaseOrderSchema.parse({
      ...req.body,
      requestedBy: req.user?.id, // Add user ID from auth context
      tenantId: req.user?.tenantId // Ensure tenantId is always present
    }) as CreatePurchaseOrderDto;

  
    const po = await purchaseOrderService.createPurchaseOrder(parsed);
    res.status(HttpStatusCode.CREATED).json({
      success: true,
      data: po
    });
  }

  
  async updatePurchaseOrder(req: Request, res: Response) {
    const { id } = req.params;
    const validated = UpdatePurchaseOrderSchema.parse({
      ...req.body,
      updatedBy: req.user?.id // Add user ID from auth context
    }) as UpdatePurchaseOrderDto;
    const po = await purchaseOrderService.updatePurchaseOrder(id, validated);
    res.json({
      success: true,
      data: po
    });
  }

  async cancelPurchaseOrder(req: Request, res: Response) {
    const { id } = req.params;
    const validated = CancelPurchaseOrderSchema.parse({
      ...req.body,
      cancelledBy: req.user?.id // Add user ID from auth context
    }) as CancelPurchaseOrderDto;
    const po = await purchaseOrderService.cancelPurchaseOrder(id, validated);
    res.json({
      success: true,
      data: po
    });
  }

  async receivePurchaseOrder(req: Request, res: Response) {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!tenantId || !userId) {
      throw new AppError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
    }

    const po = await purchaseOrderService.receivePurchaseOrder(tenantId, id, userId);
    res.json({
      success: true,
      data: po
    });
  }

  async approvePurchaseOrder(req: Request, res: Response) {
  const { id } = req.params;
  const approvedBy = req.user?.id;

  if (!approvedBy) throw new AppError("Unauthorized", 401);

  const result = await purchaseOrderService.approvePurchaseOrder(id, { approvedBy });
  res.json({ success: true, data: result });
}


  async linkPayment(req: Request, res: Response) {
    const { id } = req.params;
    const validated = LinkPaymentSchema.parse({
      ...req.body,
      linkedBy: req.user?.id // Add user ID from auth context
    }) as LinkPaymentDto;
    const po = await purchaseOrderService.linkPayment(id, validated);
    res.json({
      success: true,
      data: po
    });
  }


  async listPurchaseOrders(req: Request, res: Response) {
    const filters = {
      tenantId: req.user?.tenantId || '',
      ...req.query,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
      toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined
    };
    
    const result = await purchaseOrderService.listPurchaseOrders(filters);
    res.json({
      success: true,
      ...result
    });
  }

  async getPurchaseOrderById(req: Request, res: Response) {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    
    if (!tenantId) {
      throw new AppError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
    }

    const po = await purchaseOrderService.getPurchaseOrderById(tenantId, id);
    
    if (!po) {
      throw new AppError('Purchase order not found', HttpStatusCode.NOT_FOUND);
    }
    
    res.json({
      success: true,
      data: po
    });
  }

  async listPendingOrders(req: Request, res: Response) {
    const filters: ListPendingOrdersDto= {
      tenantId: req.user?.tenantId || '',
      status: 'pending',
      ...req.query,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined
    };
    
    const result = await purchaseOrderService.listPurchaseOrders(filters);
    res.json({
      success: true,
      ...result
    });
  }
}

export const purchaseOrderController = new PurchaseOrderController();