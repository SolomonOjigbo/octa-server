// src/modules/inventory/services/inventoryFlow.service.ts

import { StockMovementType } from "@common/types/stockMovement.dto";
import { InventoryMovementDto } from "../types/inventory.dto";
import { stockService } from "@modules/stock/services/stock.service";

class InventoryFlowService {
  /**
   * POS Sale → Reduce stock
   */
  async processPOSale(tenantId: string, userId: string, items: Array<{
    tenantProductId: string;
    tenantProductVariantId?: string;
    storeId: string;
    quantity: number;
    reference: string;
    metadata?: any;
  }>) {
    for (const item of items) {
      await stockService.adjustStock(tenantId, userId, {
        ...item,
        quantity: -Math.abs(item.quantity),
        movementType: StockMovementType.SALE,
      });
    }
  }

  /**
   * POS Return → Increase stock
   */
  async processPOSReturn(tenantId: string, userId: string, items: Array<{
    tenantProductId: string;
    tenantProductVariantId?: string;
    storeId: string;
    quantity: number;
    reference: string;
    metadata?: any;
  }>) {
    for (const item of items) {
      await stockService.adjustStock(tenantId, userId, {
        ...item,
        quantity: Math.abs(item.quantity),
        movementType: StockMovementType.RETURN,
      });
    }
  }

  /**
   * PO Receipt → Increase stock
   */
  async processPurchaseReceipt(tenantId: string, userId: string, items: Array<{
    tenantProductId: string;
    tenantProductVariantId?: string;
    storeId?: string;
    warehouseId?: string;
    quantity: number;
    costPrice: number;
    batchNumber?: string;
    expiryDate?: Date;
    reference: string;
    metadata?: any;
  }>) {
    for (const item of items) {
      await stockService.adjustStock(tenantId, userId, {
        ...item,
        quantity: Math.abs(item.quantity),
        movementType: StockMovementType.PURCHASE,
      });
    }
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

  /**
   * Stock Transfer (Out + In)
   */
  async processStockTransfer(
    tenantId: string,
    userId: string,
    items: Array<{
      tenantProductId: string;
      tenantProductVariantId?: string;
      quantity: number;
      sourceStoreId?: string;
      destinationStoreId?: string;
      sourceWarehouseId?: string;
      destinationWarehouseId?: string;
      batchNumber?: string;
      expiryDate?: Date;
      reference: string;
      metadata?: any;
    }>
  ) {
    for (const item of items) {
      // OUT: deduct from source
      await stockService.adjustStock(tenantId, userId, {
        tenantProductId: item.tenantProductId,
        tenantProductVariantId: item.tenantProductVariantId,
        quantity: -Math.abs(item.quantity),
        storeId: item.sourceStoreId,
        warehouseId: item.sourceWarehouseId,
        movementType: StockMovementType.TRANSFER_OUT,
        reference: item.reference,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        metadata: { ...item.metadata, direction: "out" }
      });

      // IN: add to destination
      await stockService.adjustStock(tenantId, userId, {
        tenantProductId: item.tenantProductId,
        tenantProductVariantId: item.tenantProductVariantId,
        quantity: Math.abs(item.quantity),
        storeId: item.destinationStoreId,
        warehouseId: item.destinationWarehouseId,
        movementType: StockMovementType.TRANSFER_IN,
        reference: item.reference,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        metadata: { ...item.metadata, direction: "in" }
      });
    }
  }

  /**
   * Admin Manual Adjustments (Positive or Negative)
   */
  async processManualAdjustment(
    tenantId: string,
    userId: string,
    dto: InventoryMovementDto
  ) {
    await stockService.adjustStock(tenantId, userId, {
      ...dto,
      movementType: StockMovementType.ADJUSTMENT
    });
  }
}

export const inventoryFlowService = new InventoryFlowService();
