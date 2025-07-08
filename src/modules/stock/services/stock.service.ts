// src/modules/stock/services/stock.service.ts

import { AdjustStockDto, StockLevelDto } from '../types/stock.dto';
import { cacheService } from '@cache/cache.service';
import { auditService } from '@modules/audit/services/audit.service';
import { eventBus } from '@events/eventBus';
import { EVENTS } from '@events/events';
import prisma from '@shared/infra/database/prisma';

export const stockService = {
  async getStockLevels(tenantId: string) {
    const cacheKey = `stock_levels:${tenantId}`;
    const cached = await cacheService.get<StockLevelDto[]>(cacheKey);
    if (cached) return cached;

    const data = await prisma.stock.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
    });
    await cacheService.set(cacheKey, data, 300);
    return data;
  },

  async adjustStock(tenantId: string, userId: string, dto: AdjustStockDto) {
    const record = await prisma.stock.create({
      data: { tenantId, ...dto },
    });
    await cacheService.del(`stock_levels:${tenantId}`);
    await auditService.log({
      tenantId,
      userId,
      module: 'Stock',
      action: 'adjust',
      entityId: record.id,
      details: dto,
    });
    eventBus.emit(EVENTS.STOCK_ADJUSTED, record);
    return record;
  },

  async incrementStock(tenantId: string, userId: string, dto: AdjustStockDto) {
    const record = await prisma.stock.upsert({
      where: {
        tenantId_tenantProductId_storeId_warehouseId: {
          tenantId,
          tenantProductId: dto.tenantProductId,
          storeId: dto.storeId,
          warehouseId: dto.warehouseId,
        },
      },
      update: { quantity: { increment: dto.quantity } },
      create: { tenantId, ...dto },
    });
    await cacheService.del(`stock_levels:${tenantId}`);
    await auditService.log({
      tenantId,
      userId,
      module: 'Stock',
      action: 'update',
      entityId: record.id,
      details: dto,
    });
    eventBus.emit(EVENTS.STOCK_UPDATED, record);
    return record;
  },

  async deleteStock(tenantId: string, userId: string, id: string) {
    const record = await prisma.stock.delete({ where: { id } });
    await cacheService.del(`stock_levels:${tenantId}`);
    await auditService.log({
      tenantId,
      userId,
      module: 'Stock',
      action: 'delete',
      entityId: id,
      details: {},
    });
    eventBus.emit(EVENTS.STOCK_DELETED, record);
  },
};
