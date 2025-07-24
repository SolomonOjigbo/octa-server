
// src/modules/inventory/services/inventory.service.ts
import { cacheService } from "@cache/cache.service";
import { auditService } from "@modules/audit/services/audit.service";
import { eventBus } from '@events/eventBus';
import { EVENTS } from '@events/events';
import { InventoryMovementDto } from '../types/inventory.dto';
import prisma from "@shared/infra/database/prisma";
import { stockService } from "@modules/stock/services/stock.service";


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
            globalProductId: dto.globalProductId,
            isTransferable: true,
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

      return movement;
    });
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

};


export const inventoryService = new InventoryService();