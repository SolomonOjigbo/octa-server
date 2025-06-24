import { PrismaClient } from "@prisma/client";
import {
    CancelPurchaseOrderDto,
  CreatePurchaseOrderDto,
  LinkPaymentDto,
  UpdatePurchaseOrderDto,
} from "../types/purchaseOrder.dto";
import { inventoryService } from "../../inventory/services/inventory.service";
import { stockService } from "../../stock/services/stock.service";

const prisma = new PrismaClient();

export class PurchaseOrderService {
  async createPurchaseOrder(dto: CreatePurchaseOrderDto) {
    return prisma.purchaseOrder.create({
      data: {
        ...dto,
        items: { create: dto.items },
      },
      include: { items: true, supplier: true },
    });
  }

  // On receive, update stock/inventory for each item
  async receivePurchaseOrder(tenantId: string, id: string, userId: string) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!po) throw new Error("PO not found");
    if (po.status === "received") throw new Error("Already received");

    // Inventory + Stock Update for each item
    for (const item of po.items) {
      // Add inventory movement
      await inventoryService.createMovement({
        tenantId,
        productId: item.productId,
        storeId: po.storeId,
        warehouseId: po.warehouseId,
        batchNumber: item.batchNumber,
        quantity: item.quantity, // IN
        movementType: "PURCHASE",
        costPrice: item.costPrice,
        expiryDate: item.expiryDate,
        reference: po.id,
      });
      // Adjust stock
      await stockService.incrementStockLevel({
        tenantId,
        productId: item.productId,
        storeId: po.storeId,
        warehouseId: po.warehouseId,
        delta: item.quantity,
      });
    }
    // Mark PO as received
    return prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: "received",
        receivedDate: new Date(),
      },
    });
  }

  // Get PO(s), update, delete...
  async getPurchaseOrders(tenantId: string) {
    return prisma.purchaseOrder.findMany({
      where: { tenantId },
      include: { items: true, supplier: true, payments: true },
      orderBy: { orderDate: "desc" },
    });
  }

  async getPurchaseOrderById(tenantId: string, id: string) {
    return prisma.purchaseOrder.findFirst({
      where: { tenantId, id },
      include: { items: true, supplier: true, payments: true },
    });
  }

   async updatePurchaseOrder(id: string, data: UpdatePurchaseOrderDto) {
    return prisma.purchaseOrder.update({
      where: { id },
      data,
      include: { items: true, supplier: true, payments: true },
    });
  }

  async cancelPurchaseOrder(id: string, dto: CancelPurchaseOrderDto) {
    return prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: "cancelled",
        notes: dto.reason ? `Cancelled: ${dto.reason}` : undefined,
      },
    });
  }

  async linkPayment(id: string, dto: LinkPaymentDto) {
    // Add a record to the payment relation/table
    // (You’ll need to define Payment model and service)
    return prisma.purchaseOrder.update({
      where: { id },
      data: {
        payments: {
          connect: { id: dto.paymentId },
        },
      },
      include: { payments: true },
    });
  }
}
export const purchaseOrderService = new PurchaseOrderService();
