import { PrismaClient } from "@prisma/client";
import { CreateStockTransferDto } from "../types/stockTransfer.dto";
import { inventoryService } from "../../inventory/services/inventory.service";
import { stockService } from "../../stock/services/stock.service";

const prisma = new PrismaClient();

export class StockTransferService {
  // 1. Create a new stock transfer request
  async createTransfer(dto: CreateStockTransferDto) {
    const transfer = await prisma.stockTransfer.create({
      data: {
        ...dto,
        status: "pending",
      },
    });
    return transfer;
  }

  // 2. Approve a transfer (by receiver/tenant B)
  async approveTransfer(transferId: string, approvedBy: string) {
    // 1. Get the transfer record
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id: transferId },
    });
    if (!transfer) throw new Error("Transfer not found");
    if (transfer.status !== "pending") throw new Error("Transfer not pending");

    // 2. Deduct from sender's inventory & stock
    await inventoryService.createInventoryMovement({
      tenantId: transfer.tenantId,
      productId: transfer.productId,
      storeId: transfer.fromStoreId,
      warehouseId: transfer.fromWarehouseId,
      quantity: -transfer.quantity,
      movementType: "TRANSFER_OUT",
      reference: transfer.id,
    });
    await stockService.adjustStockLevel({
        tenantId: transfer.tenantId,
        productId: transfer.productId,
        storeId: transfer.fromStoreId,
        warehouseId: transfer.fromWarehouseId,
        delta: -transfer.quantity,
        quantity: 0
    });

    // 3. Add to receiver's inventory & stock
    await inventoryService.createInventoryMovement({
      tenantId: transfer.toTenantId!,
      productId: transfer.productId,
      storeId: transfer.toStoreId,
      warehouseId: transfer.toWarehouseId,
      quantity: transfer.quantity,
      movementType: "TRANSFER_IN",
      reference: transfer.id,
    });
    await stockService.adjustStockLevel({
        tenantId: transfer.toTenantId!,
        productId: transfer.productId,
        storeId: transfer.toStoreId,
        warehouseId: transfer.toWarehouseId,
        delta: transfer.quantity,
        quantity: 0
    });

    // 4. Update transfer status
    const updatedTransfer = await prisma.stockTransfer.update({
      where: { id: transferId },
      data: {
        status: "completed",
        approvedBy,
        updatedAt: new Date(),
      },
    });

    return updatedTransfer;
  }

  // Reject a transfer (typically by the receiver)
  async rejectTransfer(transferId: string, rejectedBy: string, notes?: string) {
    const transfer = await prisma.stockTransfer.findUnique({ where: { id: transferId } });
    if (!transfer) throw new Error("Transfer not found");
    if (transfer.status !== "pending") throw new Error("Only pending transfers can be rejected");

    return prisma.stockTransfer.update({
      where: { id: transferId },
      data: {
        status: "rejected",
        approvedBy: rejectedBy,
        notes,
        updatedAt: new Date(),
      },
    });
  }

  // Cancel a transfer (typically by the initiator before it's approved/rejected)
  async cancelTransfer(transferId: string, cancelledBy: string, notes?: string) {
    const transfer = await prisma.stockTransfer.findUnique({ where: { id: transferId } });
    if (!transfer) throw new Error("Transfer not found");
    if (transfer.status !== "pending") throw new Error("Only pending transfers can be cancelled");

    return prisma.stockTransfer.update({
      where: { id: transferId },
      data: {
        status: "cancelled",
        approvedBy: cancelledBy,
        notes,
        updatedAt: new Date(),
      },
    });
  }

  // List transfers (with filters)
  async listTransfers(filters: {
    tenantId?: string;
    toTenantId?: string;
    status?: string;
    storeId?: string;
    productId?: string;
    transferType?: string;
    limit?: number;
    offset?: number;
  }) {
    return prisma.stockTransfer.findMany({
      where: {
        ...(filters.tenantId && { tenantId: filters.tenantId }),
        ...(filters.toTenantId && { toTenantId: filters.toTenantId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.storeId && {
          OR: [{ fromStoreId: filters.storeId }, { toStoreId: filters.storeId }],
        }),
        ...(filters.productId && { productId: filters.productId }),
        ...(filters.transferType && { transferType: filters.transferType }),
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
      orderBy: { createdAt: "desc" },
    });
  }

  // Get single transfer details
  async getTransferById(transferId: string) {
    return prisma.stockTransfer.findUnique({
      where: { id: transferId },
      include: {
        fromStore: true,
        toStore: true,
        fromWarehouse: true,
        toWarehouse: true,
        product: true,
        b2bConnection: true,
      },
    });
  }

  // Delete (void) transfer -- typically admin only, and only if not completed
  async deleteTransfer(transferId: string) {
    const transfer = await prisma.stockTransfer.findUnique({ where: { id: transferId } });
    if (!transfer) throw new Error("Transfer not found");
    if (transfer.status === "completed")
      throw new Error("Cannot delete a completed transfer");
    return prisma.stockTransfer.delete({ where: { id: transferId } });
  }
}

export const stockTransferService = new StockTransferService();
