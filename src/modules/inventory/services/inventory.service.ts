
// src/modules/inventory/services/inventory.service.ts
import { cacheService } from "@cache/cache.service";
import { auditService } from "@modules/audit/services/audit.service";
import { eventBus } from '@events/eventBus';
import { EVENTS } from '@events/events';
import { CheckAvailabilityDto, InventoryMovementDto, ReserveStockDto } from '../types/inventory.dto';
import prisma from "@shared/infra/database/prisma";
import { stockService } from "@modules/stock/services/stock.service";
import { StockMovementType } from "@common/types/stockMovement.dto";


export class InventoryService {

async createMovement(
    tenantId: string,
    userId: string,
    dto: InventoryMovementDto
  ) {
    // 1) Resolve tenantProductId from globalProductId if needed
    let tenantProductId = dto.tenantProductId!;
    if (!tenantProductId && dto.globalProductId) {
      let tp = await prisma.tenantProduct.findFirst({
        where: {
          tenantId,
          globalProductId: dto.globalProductId,
        },
      });
      if (!tp) {
        tp = await prisma.tenantProduct.create({
          data: {
            tenantId,
            globalProduct: {connect: {id: dto.globalProductId}},
            isTransferable: true,
            isVariable: dto.tenantProductVariantId? true : false,
            costPrice: dto.costPrice,
            name: dto.name,
          sku: dto.sku,
          },
        });
      }
      tenantProductId = tp.id;
    }
    if (!tenantProductId) {
      throw new Error(
        "Must supply exactly one of 'tenantProductId' or 'globalProductId'"
      );
    }

    // 2) Atomically adjust stock and record inventory
    return prisma.$transaction(async (tx) => {
      // adjust stock
      await stockService.adjustStock(tenantId, userId, {
        tenantProductId,
        tenantProductVariantId: dto.tenantProductVariantId,
        storeId: dto.storeId ?? null,
        warehouseId: dto.warehouseId ?? null,
        batchNumber: dto.batchNumber,
        expiryDate: dto.expiryDate,
        quantity: dto.quantity,
        reference: dto.reference,
        movementType: dto.movementType,
      });

      // record inventory movement
      const movement = await tx.inventory.create({
        data: {
          tenantId,
          tenantProductId,
          tenantProductVariantId: dto.tenantProductVariantId ?? null,
          storeId: dto.storeId ?? null,
          warehouseId: dto.warehouseId ?? null,
          batchNumber: dto.batchNumber ?? null,
          quantity: dto.quantity,
          costPrice: dto.costPrice ?? undefined,
          expiryDate: dto.expiryDate ?? undefined,
          movementType: dto.movementType,
          reference: dto.reference,
          metadata: dto.metadata,
          createdById: userId,
        },
      });

      // emit event for downstream flows (reports, reconciliation, notifications)
      eventBus.emit(EVENTS.INVENTORY_MOVEMENT_CREATED, {
        movement,
        tenantId,
        userId,
      });

      if (dto.movementType === 'ADJUSTMENT') {
        eventBus.emit(EVENTS.INVENTORY_ADJUSTMENT, {
          movementId: movement.id,
          performedBy: userId,
          details: dto
        });
      }

      return movement;
    });
  }

  async checkLowStock(tenantId: string, threshold = 10) {
  const lowStockItems = await prisma.stock.findMany({
    where: {
      tenantId,
      quantity: { lt: threshold }
    },
    include: {
      tenantProduct: true,
      tenantVariant: true
    }
  });

  if (lowStockItems.length > 0) {
    eventBus.emit(EVENTS.LOW_STOCK_ALERT, {
      tenantId,
      threshold,
      items: lowStockItems.map(item => ({
        productId: item.tenantProductId,
        product: item.tenantProduct,
        variant: item.tenantVariant,
        currentQuantity: item.quantity,
        minQuantity: threshold,
        storeId: item.storeId,
        warehouseId: item.warehouseId
      }))
    });
  }
}

  /**
   * Search inventory movements, filtering by either tenantProductId or globalProductId.
   */
   async searchMovements(
    tenantId: string,
    filters: {
      tenantProductId?: string;
      globalProductId?: string;
      tenantProductVariantId?: string;
      storeId?: string;
      warehouseId?: string;
      startDate?: Date;
      endDate?: Date;
      movementType?: string;
      voided?: boolean;
    }
  ) {
    const {
      tenantProductId,
      globalProductId,
      tenantProductVariantId,
      storeId,
      warehouseId,
      startDate,
      endDate,
      movementType,
      voided = false,
    } = filters;

    // 1) Must supply exactly one of tenantProductId or globalProductId
    if (Boolean(tenantProductId) === Boolean(globalProductId)) {
      throw new Error(
        "Must supply exactly one of 'tenantProductId' or 'globalProductId'"
      );
    }

    // 2) Build the `where` filter
    const where: any = {
      tenantId,
      tenantProductVariantId: tenantProductVariantId ?? undefined,
      storeId: storeId ?? undefined,
      warehouseId: warehouseId ?? undefined,
      movementType: movementType ?? undefined,
      voided,
      createdAt: {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      },
    };

    // 3) Attach tenantProductId condition
    if (globalProductId) {
      // Look up all tenantProductIds for this globalProductId
      const tps = await prisma.tenantProduct.findMany({
        where: { tenantId, globalProductId },
        select: { id: true },
      });
      const ids = tps.map((t) => t.id);
      where.tenantProductId = { in: ids };
    } else {
      // Single tenantProductId
      where.tenantProductId = tenantProductId;
    }

    // 4) Query
    return prisma.inventory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }


  async getMovements(tenantId: string) {
    const cacheKey = `inventory_movements:${tenantId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;
    const data = await prisma.inventory.findMany({ where: { tenantId } });
    await cacheService.set(cacheKey, data, 300);
    return data;
  }


  async getById(tenantId: string, id: string) {
    const cacheKey = `inventory:${id}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;
    const record = await prisma.inventory.findFirst({ where: { id, tenantId } });
    if (!record) throw new Error('Not Found');
    await cacheService.set(cacheKey, record, 300);
    return record;
  }

async updateMovement(
  tenantId: string,
  userId: string,
  id: string,
  dto: Partial<Pick<InventoryMovementDto, "metadata" | "expiryDate" | "batchNumber">>
) {
  const existing = await prisma.inventory.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== tenantId) {
    throw new Error("Movement not found or unauthorized.");
  }

  if (existing.voided) {
    throw new Error("Cannot update a voided movement.");
  }

  const updated = await prisma.inventory.update({
    where: { id },
    data: {
      metadata: existing.metadata && dto.metadata
        ? { ...dto.metadata }
        : dto.metadata || existing.metadata,
      batchNumber: dto.batchNumber,
      expiryDate: dto.expiryDate,
    },
  });

   await cacheService.del(`inventory_movements:${tenantId}`);
    await cacheService.del(`inventory:${id}`);
    await auditService.log({
      tenantId, userId,
      module: 'Inventory',
      action: 'update',
      entityId: id,
      details: dto,
    });
    eventBus.emit(EVENTS.INVENTORY_MOVEMENT_UPDATED, updated);
    return updated;
}
  async deleteMovement(tenantId: string, userId: string, id: string) {
    const rec = await prisma.inventory.delete({ where: { id } });
    await cacheService.del(`inventory_movements:${tenantId}`);
    await cacheService.del(`inventory:${id}`);
    await auditService.log({
      tenantId, userId,
      module: 'Inventory',
      action: 'delete',
      entityId: id,
      details: {},
    });
    eventBus.emit(EVENTS.INVENTORY_MOVEMENT_DELETED, rec);
  }


  async voidInventoryMovement(tenantId: string, userId: string, movementId: string, reason: string) {
  const record = await prisma.inventory.findFirst({
    where: { id: movementId, tenantId },
  });

  if (!record) throw new Error("Inventory movement not found.");
  if (record.voided) throw new Error("Movement is already voided.");

  const updated = await prisma.inventory.update({
    where: { id: movementId },
    data: {
      voided: true,
      metadata: {
        voidedBy: userId,
        voidedAt: new Date().toISOString(),
        voidReason: reason,
      },
    },
  });
await cacheService.del(`inventory_movements:${tenantId}`);
    await cacheService.del(`inventory:${movementId}`);
    await auditService.log({
      tenantId, userId,
      module: 'Inventory',
      action: 'delete',
      entityId: movementId,
      details: {},
    });
    eventBus.emit(EVENTS.INVENTORY_MOVEMENT_VOIDED, updated);
  return updated;
}
async checkAvailability(dto: CheckAvailabilityDto): Promise<boolean> {
    const { tenantId, productId, variantId, quantity, warehouseId, storeId } = dto;
    
    const where: any = { 
      tenantId,
      tenantProductId: productId,
      voided: false
    };
    
    if (variantId) where.tenantProductVariantId = variantId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (storeId) where.storeId = storeId;

    const stock = await prisma.stock.aggregate({
      where,
      _sum: {
        quantity: true,
        reservedQuantity: true
      }
    });

    const availableQuantity = (stock._sum.quantity || 0) - (stock._sum.reservedQuantity || 0);
    return availableQuantity >= quantity;
  }

  async reserveStockForTransfer(tenantId: string, userId: string, dto: ReserveStockDto) {
    return prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        const { tenantProductId, tenantProductVariantId, quantity, warehouseId, storeId } = item;
        
        // Check availability
        const available = await this.checkAvailability({
          tenantId,
          productId: tenantProductId,
          variantId: tenantProductVariantId,
          quantity,
          warehouseId,
          storeId
        });
        
        if (!available) {
          throw new Error(`Insufficient stock for product ${tenantProductId}`);
        }

        // Update stock
        await tx.stock.updateMany({
          where: {
            tenantId,
            tenantProductId,
            tenantProductVariantId: tenantProductVariantId || undefined,
            warehouseId: warehouseId || undefined,
            storeId: storeId || undefined,
            quantity: { gte: quantity }
          },
          data: {
            reservedQuantity: { increment: quantity }
          }
        });

        // Record inventory movement
        await tx.inventory.create({
          data: {
            tenantId,
            tenantProductId,
            tenantProductVariantId: tenantProductVariantId || null,
            warehouseId: warehouseId || null,
            storeId: storeId || null,
            quantity,
            movementType: StockMovementType.RESERVED,
            reference: dto.transferId,
            createdById: userId
          }
        });
      }

      eventBus.emit(EVENTS.STOCK_RESERVED, {
        tenantId,
        transferId: dto.transferId,
        items: dto.items
      });
    });
  }

  async releaseReservedStock(tenantId: string, transferId: string) {
    return prisma.$transaction(async (tx) => {
      // Find reserved items
      const reservations = await tx.inventory.findMany({
        where: {
          tenantId,
          reference: transferId,
          movementType: StockMovementType.RESERVED,
          voided: false
        }
      });

      for (const reservation of reservations) {
        // Release reservation
        await tx.stock.updateMany({
          where: {
            tenantId,
            tenantProductId: reservation.tenantProductId,
            tenantProductVariantId: reservation.tenantProductVariantId || undefined,
            warehouseId: reservation.warehouseId || undefined,
            storeId: reservation.storeId || undefined
          },
          data: {
            reservedQuantity: { decrement: reservation.quantity }
          }
        });

        // Void the reservation movement
        await tx.inventory.update({
          where: { id: reservation.id },
          data: {
            voided: true,
            metadata: {
              ...(reservation.metadata as object),
              releasedAt: new Date().toISOString(),
              releaseReason: 'Transfer cancellation/rejection'
            }
          }
        });
      }

      eventBus.emit(EVENTS.STOCK_RELEASED, {
        tenantId,
        transferId,
        releasedItems: reservations.map(r => ({
          productId: r.tenantProductId,
          variantId: r.tenantProductVariantId,
          quantity: r.quantity
        }))
      });
    });
  }
// Add to InventoryService class
  startLowStockMonitor(intervalMinutes = 60) {
    setInterval(async () => {
      const tenants = await prisma.tenant.findMany();
      for (const tenant of tenants) {
        // Get tenant-specific threshold from settings
        const threshold = 10;
        await this.checkLowStock(tenant.id, threshold);
      }
    }, intervalMinutes * 60 * 1000);
  }
};


export const inventoryService = new InventoryService();