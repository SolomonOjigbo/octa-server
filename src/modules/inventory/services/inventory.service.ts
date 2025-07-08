
// src/modules/inventory/services/inventory.service.ts
import { cacheService } from "@cache/cache.service";
import { auditService } from "@modules/audit/services/audit.service";
import { eventBus } from '@events/eventBus';
import { EVENTS } from '@events/events';
import { InventoryMovementDto, UpdateInventoryMovementDto } from '../types/inventory.dto';
import prisma from "@shared/infra/database/prisma";


export class InventoryService {
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

  async createMovement(
    tenantId: string,
    userId: string,
    dto: InventoryMovementDto
  ) {
    const rec = await prisma.inventory.create({
      data: { tenantId, createdById: userId, ...dto },
    });
    // invalidate
    await cacheService.del(`inventory_movements:${tenantId}`);
    // audit
    await auditService.log({
      tenantId, userId,
      module: 'Inventory',
      action: 'create',
      entityId: rec.id,
      details: dto,
    });
    // event
    eventBus.emit(EVENTS.INVENTORY_MOVEMENT_CREATED, rec);
    return rec;
  }

  async updateMovement(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateInventoryMovementDto
  ) {
    const existing = await prisma.inventory.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Not Found');
    const rec = await prisma.inventory.update({
      where: { id },
      data: { ...dto, verifiedById: userId },
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
    eventBus.emit(EVENTS.INVENTORY_MOVEMENT_UPDATED, rec);
    return rec;
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
};


export const inventoryService = new InventoryService();