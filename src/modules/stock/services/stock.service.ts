// src/modules/stock/services/stock.service.ts

import { AdjustProductStockDto, AdjustVariantStockDto, StockLevelDto } from '../types/stock.dto';
import { cacheService } from '@cache/cache.service';
import { auditService } from '@modules/audit/services/audit.service';
import { eventBus } from '@events/eventBus';
import { EVENTS } from '@events/events';
import prisma from '@shared/infra/database/prisma';
import { logger } from '@logging/logger';
import { CacheKeys } from '@cache/cacheKeys';
import { InventoryMovementDto } from '@modules/inventory/types/inventory.dto';

export class StockService {
    /** 
   * Atomically adjust stock and record an inventory movement 
   */
 async adjustStock(
    tenantId: string,
    userId: string,
    dto: any
  ) {
    return prisma.$transaction(async (tx) => {
      const where = {
        tenantId,
        tenantProductId: dto.tenantProductId,
        storeId: dto.storeId ?? null,
        warehouseId: dto.warehouseId ?? null,
        tenantProductVariantId: dto.tenantProductVariantId ?? null,
        batchNumber: dto.batchNumber ?? null,
      };

      // Fetch current stock
      const existing = await tx.stock.findUnique({ where: {id: dto.id} });
      const oldQty = existing?.quantity ?? 0;
      const newQty = oldQty + dto.quantity;

      if (newQty < 0) {
        throw new Error("Cannot reduce stock below zero.");
      }

      // Upsert stock
      const stock = await tx.stock.upsert({
        where: {id: dto.id},
        create: { ...dto, quantity: newQty },
        update: { quantity: newQty },
      });

      // Record inventory movement
      await tx.inventory.create({
        data: {
          tenantId,
          storeId: dto.storeId ?? null,
          warehouseId: dto.warehouseId ?? null,
          tenantProductId: dto.tenantProductId,
          tenantProductVariantId: dto.tenantProductVariantId ?? null,
          batchNumber: dto.batchNumber ?? null,
          quantity: dto.quantity,
          costPrice: dto.costPrice ?? null,
          expiryDate: dto.expiryDate,
          movementType: dto.movementType,
          reference: dto.reference,
          metadata: dto.metadata ?? {},
          createdById: userId,
        },
      });

      // Audit
      await auditService.log({
        tenantId,
        userId,
        module: "stock",
        action: dto.quantity > 0 ? "increase" : "decrease",
        entityId: stock.id,
        details: {
          oldQty,
          newQty,
          movementType: dto.movementType,
          reference: dto.reference,
          batchNumber: dto.batchNumber,
          expiryDate: dto.expiryDate,
          metadata: dto.metadata,
        },
      });

      // Emit event
      eventBus.emit(EVENTS.STOCK_UPDATED, {
        tenantId,
        stockId: stock.id,
        delta: dto.quantity,
        userId,
      });

      // Invalidate cache
      await cacheService.del(`stock:list:${tenantId}`);
      await cacheService.del(`stock:detail:${stock.id}`);

      logger.info(`Stock adjusted (${dto.quantity}) for ${stock.id}`);
      return stock;
    });
  }

  /**
   * Convenience wrapper for product-level stock
   */
  async incrementProductStock(
    tenantId: string,
    userId: string,
    dto: AdjustProductStockDto
  ) {
    // No variant → call the generic
    return this.adjustStock(tenantId, userId, dto);
  }

  /**
   * Convenience wrapper for variant-level stock
   */
  async incrementVariantStock(
    tenantId: string,
    userId: string,
    dto: AdjustVariantStockDto
  ) {
    if (!dto.tenantProductVariantId) {
      throw new Error("tenantProductVariantId is required for variant adjustments.");
    }
    // Validate variant belongs to product
    const variant = await prisma.tenantVariant.findUnique({
      where: { id: dto.tenantProductVariantId },
    });
    if (!variant || variant.tenantProductId !== dto.tenantProductId) {
      throw new Error("Variant does not belong to the specified product.");
    }
    return this.adjustStock(tenantId, userId, dto);
  }
  /** 
   * 1) Read & cache all stock levels for a tenant
   */
  async getStockLevels(tenantId: string) {
    const key = CacheKeys.stock(tenantId);
    const cached = await cacheService.get(key);
    if (cached) return cached;

    const rows = await prisma.stock.findMany({
      where: { tenantId },
      orderBy: { updatedAt: "desc" },
    });
    await cacheService.set(key, rows, 300);
    return rows;
  }


/**
   * 3) Hard delete (admin use only)
   */
  async deleteStock(tenantId: string, userId: string, id: string) {
    const record = await prisma.stock.delete({ where: { id } });
    await cacheService.del(CacheKeys.stockLevels(tenantId));
    await auditService.log({
      tenantId,
      userId,
      module: "stock",
      action: "delete",
      entityId: id,
      details: {},
    });
    eventBus.emit(EVENTS.STOCK_DELETED, { tenantId, stockId: id, userId });
    logger.info(`Stock deleted: ${id}`);
    return record;
  }
};

export const stockService = new StockService();