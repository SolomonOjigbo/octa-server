
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
    // Perform atomic stock + inventory update
    return prisma.$transaction(async (tx) => {
      // 1. Adjust stock
      const stock = await stockService.adjustStock(tenantId, userId, {
        ...dto,
        storeId: dto.storeId ?? null,
        warehouseId: dto.warehouseId ?? null,
      });

      // 2. Record inventory movement
      const inventory = await tx.inventory.create({
        data: {
          tenantId,
          tenantProductId: dto.tenantProductId,
          tenantProductVariantId: dto.tenantProductVariantId,
          storeId: dto.storeId,
          warehouseId: dto.warehouseId,
          batchNumber: dto.batchNumber,
          quantity: dto.quantity,
          costPrice: dto.costPrice,
          expiryDate: dto.expiryDate,
          movementType: dto.movementType,
          reference: dto.reference,
          metadata: dto.metadata,
          createdById: userId,
        },
      });

      return inventory;
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

  async searchMovements(tenantId: string, filters: {
  productId?: string;
  variantId?: string;
  storeId?: string;
  warehouseId?: string;
  startDate?: Date;
  endDate?: Date;
  movementType?: string;
  voided?: boolean;
}) {
  return prisma.inventory.findMany({
    where: {
      tenantId,
      tenantProductId: filters.productId,
      tenantProductVariantId: filters.variantId,
      storeId: filters.storeId,
      warehouseId: filters.warehouseId,
      movementType: filters.movementType,
      voided: filters.voided ?? false,
      createdAt: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
    },
    orderBy: { createdAt: "desc" },
  });
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
      metadata: { ...existing.metadata, ...dto.metadata },
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
        ...record.metadata,
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