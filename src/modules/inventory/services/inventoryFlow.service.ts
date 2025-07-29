// src/modules/inventory/services/inventoryFlow.service.ts

import { StockMovementType } from "@common/types/stockMovement.dto";
import { BaseItem, InventoryMovementDto } from "../types/inventory.dto";
import { stockService } from "@modules/stock/services/stock.service";
import { eventBus } from "@events/eventBus";
import { auditService } from "@modules/audit/services/audit.service";
import prisma from "@shared/infra/database/prisma";
import { EVENTS } from "@events/events";

export class InventoryFlowService {
   /** Resolves tenantProductId from either field, error if neither or both */
  private async resolveTenantProductId(
    tenantId: string,
    item: { tenantProductId?: string; globalProductId?: string }
  ): Promise<string> {
    const { tenantProductId, globalProductId } = item;
    if (!!tenantProductId === !!globalProductId) {
      throw new Error(
        "Must supply exactly one of tenantProductId or globalProductId"
      );
    }
    if (tenantProductId) {
      return tenantProductId;
    }
    // find-or-create copy
    let tp = await prisma.tenantProduct.findFirst({
      where: { tenantId, globalProductId },
      select: { id: true },
    });
    if (!tp) {
      const globalProduct = await prisma.globalProduct.findUnique({
        where: { id: globalProductId}
      })

      tp = await prisma.tenantProduct.create({
        data: { 
            tenantId,
            globalProduct: {connect: {id: globalProductId}},
            isTransferable: true,
            isVariable: false,
            name: globalProduct.name,
            sku: globalProduct.sku
         },
        select: { id: true },
      });
    }
    return tp.id;
  }

  /** Records the inventory movement & audit & event */
  private async recordMovement(
    tenantId: string,
    userId: string,
    data: {
      tenantProductId: string;
      tenantProductVariantId?: string;
      storeId?: string;
      warehouseId?: string;
      batchNumber?: string;
      expiryDate?: Date;
      quantity: number;
      costPrice?: number;
      movementType: StockMovementType | string;
      reference: string;
      metadata?: any;
    }
  ) {
    // 1. adjust stock
    await stockService.adjustStock(tenantId, userId, {
      tenantProductId: data.tenantProductId,
      tenantProductVariantId: data.tenantProductVariantId,
      storeId: data.storeId,
      warehouseId: data.warehouseId,
      batchNumber: data.batchNumber,
      expiryDate: data.expiryDate,
      quantity: data.quantity,
      movementType: data.movementType,
      reference: data.reference,
    });

    // 2. record inventory
    const mv = await prisma.inventory.create({
      data: {
        tenantId,
        tenantProductId: data.tenantProductId,
        tenantProductVariantId: data.tenantProductVariantId ?? null,
        storeId: data.storeId ?? null,
        warehouseId: data.warehouseId ?? null,
        batchNumber: data.batchNumber ?? null,
        quantity: data.quantity,
        costPrice: data.costPrice ?? undefined,
        expiryDate: data.expiryDate ?? undefined,
        movementType: data.movementType,
        reference: data.reference,
        metadata: data.metadata,
        createdById: userId,
      },
    });

    // 3. audit
    auditService.log({
      tenantId,
      userId,
      module: "InventoryFlow",
      action: data.movementType,
      entityId: mv.id,
      details: data,
    });

    // 4. emit event
    eventBus.emit(EVENTS.INVENTORY_MOVEMENT_CREATED, {
      tenantId,
      userId,
      movement: mv,
    });

    return mv;
  }

  /** POS sale: negative qty, movementType=SALE */
  async processPOSale(
    tenantId: string,
    userId: string,
    items: Array<BaseItem & { storeId: string }>
  ) {
    for (const i of items) {
      const tpid = await this.resolveTenantProductId(tenantId, i);
      await this.recordMovement(tenantId, userId, {
        ...i,
        tenantProductId: tpid,
        quantity: -Math.abs(i.quantity),
        movementType: StockMovementType.SALE,
      });
    }
  }

  /** POS return: positive qty, movementType=RETURN */
  async processPOSReturn(
    tenantId: string,
    userId: string,
    items: Array<BaseItem & { storeId: string }>
  ) {
    for (const i of items) {
      const tpid = await this.resolveTenantProductId(tenantId, i);
      await this.recordMovement(tenantId, userId, {
        ...i,
        tenantProductId: tpid,
        quantity: Math.abs(i.quantity),
        movementType: StockMovementType.RETURN,
      });
    }
  }

  /** Purchase receipt: positive, movementType=PURCHASE */
  async processPurchaseReceipt(
    tenantId: string,
    userId: string,
    items: Array<
      BaseItem & {
        costPrice: number;
        warehouseId?: string;
      }
    >
  ) {
    for (const i of items) {
      const tpid = await this.resolveTenantProductId(tenantId, i);
      await this.recordMovement(tenantId, userId, {
        ...i,
        tenantProductId: tpid,
        quantity: Math.abs(i.quantity),
        movementType: StockMovementType.PURCHASE,
        costPrice: i.costPrice,
      });
    }
  }

  
  /** Direct manual adjustment: movementType=ADJUSTMENT */
  async processManualAdjustment(
    tenantId: string,
    userId: string,
    dto: BaseItem
  ) {
    const tpid = await this.resolveTenantProductId(tenantId, dto);
    await this.recordMovement(tenantId, userId, {
      ...dto,
      tenantProductId: tpid,
      movementType: StockMovementType.ADJUSTMENT,
    });
  }

  /** When a PO is received, call this from purchaseOrderService or subscriber */
  async recordReceiptForPO(
    tenantId: string,
    userId: string,
    purchaseOrderId: string
  ) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { items: true },
    });
    if (!po) throw new Error("PO not found");

    for (const item of po.items) {
      await this.recordMovement(tenantId, userId, {
        tenantProductId: item.tenantProductId,
        tenantProductVariantId: item.tenantProductVariantId ?? undefined,
        storeId: po.storeId ?? undefined,
        warehouseId: po.warehouseId ?? undefined,
        batchNumber: item.batchNumber ?? undefined,
        expiryDate: item.expiryDate ?? undefined,
        quantity: item.quantity,
        costPrice: item.costPrice,
        movementType: StockMovementType.PURCHASE,
        reference: purchaseOrderId,
      });
    }

    eventBus.emit(EVENTS.INVENTORY_RECEIPT_FROM_PO, {
      tenantId,
      purchaseOrderId,
    });
  }

  async recordPurchaseOrderReceipt(dto: {
  tenantId: string;
  userId: string;
  storeId?: string;
  warehouseId?: string;
  purchaseOrderId: string;
  tenantProductId: string;
  tenantProductVariantId?: string;
  quantity: number;
  costPrice: number;
  batchNumber?: string;
  expiryDate?: Date;
  movementType: 'receipt';
  reference: string;
}) {
  await stockService.adjustStock(dto.tenantId, dto.userId, {
    tenantProductId: dto.tenantProductId,
    tenantProductVariantId: dto.tenantProductVariantId,
    storeId: dto.storeId,
    warehouseId: dto.warehouseId,
    batchNumber: dto.batchNumber,
    expiryDate: dto.expiryDate,
    quantity: dto.quantity,
    costPrice: dto.costPrice,
    movementType: dto.movementType,
    reference: dto.reference,
  });

  // Add audit or event if needed
}


  /** Decrement on consumption (sale, transfer out, return to supplier...) */
  async recordConsumption(params: {
    tenantId: string;
    userId: string;
    transactionId?: string;
  } & BaseItem) {
    const tpid = await this.resolveTenantProductId(
      params.tenantId,
      params
    );
    await this.recordMovement(params.tenantId, params.userId, {
      tenantProductId: tpid,
      tenantProductVariantId:
        params.tenantProductVariantId ?? undefined,
      storeId: params.storeId ?? undefined,
      warehouseId: params.warehouseId ?? undefined,
      batchNumber: params.batchNumber ?? undefined,
      expiryDate: params.expiryDate ?? undefined,
      quantity: -Math.abs(params.quantity),
      movementType: StockMovementType.CONSUMPTION,
      reference: params.transactionId ?? params.reference,
      metadata: params.metadata,
    });
  }

  /** Stock transfer (out + in) */
  async processStockTransfer(
    tenantId: string,
    userId: string,
    items: Array<
      BaseItem & {
        sourceStoreId?: string;
        destinationStoreId?: string;
        sourceWarehouseId?: string;
        destinationWarehouseId?: string;
      }
    >
  ) {
    for (const i of items) {
      const tpid = await this.resolveTenantProductId(tenantId, i);

      // OUT
      await this.recordMovement(tenantId, userId, {
        tenantProductId: tpid,
        tenantProductVariantId:
          i.tenantProductVariantId ?? undefined,
        storeId: i.sourceStoreId,
        warehouseId: i.sourceWarehouseId,
        quantity: -Math.abs(i.quantity),
        movementType: StockMovementType.TRANSFER_OUT,
        reference: i.reference,
        metadata: { ...i.metadata, direction: "out" },
        batchNumber: i.batchNumber,
        expiryDate: i.expiryDate,
      });

      // IN
      await this.recordMovement(tenantId, userId, {
        tenantProductId: tpid,
        tenantProductVariantId:
          i.tenantProductVariantId ?? undefined,
        storeId: i.destinationStoreId,
        warehouseId: i.destinationWarehouseId,
        quantity: Math.abs(i.quantity),
        movementType: StockMovementType.TRANSFER_IN,
        reference: i.reference,
        metadata: { ...i.metadata, direction: "in" },
        batchNumber: i.batchNumber,
        expiryDate: i.expiryDate,
      });
    }
  }

  /** When a transfer is received, call this from stockTransferService */
  // async recordStockTransferReceipt(
  //   tenantId: string,
  //   userId: string,
  //   stockTransferId: string
  // ) {
  //   const transfer = await prisma.stockTransfer.findUnique({
  //     where: { id: stockTransferId },
  //     include: { items: true },
  //   });
  //   if (!transfer) throw new Error("Transfer not found");

  //   for (const item of transfer.items) {
  //     await this.recordMovement(tenantId, userId, {
  //       tenantProductId: item.tenantProductId,
  //       tenantProductVariantId:
  //         item.tenantProductVariantId ?? undefined,
  //       storeId: transfer.toStoreId ?? undefined,
  //       warehouseId:
  //         transfer.toWarehouseId ?? undefined,
  //       batchNumber: item.batchNumber ?? undefined,
  //       expiryDate: item.expiryDate ?? undefined,
  //       quantity: item.quantity,
  //       movementType: StockMovementType.TRANSFER_IN,
  //       reference: stockTransferId,
  //       metadata: undefined,
  //       costPrice: item.costPrice ?? undefined,
  //     });
  //   }

  //   eventBus.emit(EVENTS.STOCK_TRANSFER_RECEIPT_RECORDED, {
  //     tenantId,
  //     stockTransferId,
  //   });
  // }

  async recordStockTransferReceipt(
    tenantId: string,
    userId: string,
    stockTransferId: string
  ) {
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id: stockTransferId },
      include: { items: true },
    });
    
    if (!transfer) throw new Error("Transfer not found");

    for (const item of transfer.items) {
      // Check if product is transferable
      const product = await prisma.tenantProduct.findUnique({
        where: { id: item.destTenantProductId }
      });
      
      if (!product || !product.isTransferable) {
        throw new Error(`Product ${item.destTenantProductId } is not transferable`);
      }

      await this.recordMovement(tenantId, userId, {
        tenantProductId: item.destTenantProductId,
        tenantProductVariantId: item.destTenantProductVariantId || undefined,
        storeId: transfer.toStoreId || undefined,
        warehouseId: transfer.toWarehouseId || undefined,
        batchNumber: item.batchNumber || undefined,
        expiryDate: item.expiryDate || undefined,
        quantity: item.quantity,
        movementType: StockMovementType.TRANSFER_IN,
        reference: stockTransferId,
        costPrice: item.costPrice || undefined,
      });
    }

    eventBus.emit(EVENTS.STOCK_TRANSFER_RECEIPT_RECORDED, {
      tenantId,
      stockTransferId,
    });
  }

  /**
   * Supplier Return → Decrease stock
   */
  async processReturnToSupplier(tenantId: string, userId: string, items: Array<{
    tenantProductId: string;
    tenantProductVariantId?: string;
    warehouseId?: string;
    quantity: number;
    reference: string;
    metadata?: any;
  }>) {
    for (const item of items) {
      await stockService.adjustStock(tenantId, userId, {
        ...item,
        quantity: -Math.abs(item.quantity),
        movementType: StockMovementType.RETURN_TO_SUPPLIER,
      });
    }
  }


}

export const inventoryFlowService = new InventoryFlowService();
