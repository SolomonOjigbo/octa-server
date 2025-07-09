// modules/purchaseOrder/services/purchaseOrder.service.ts
import { inventoryService } from "../../inventory/services/inventory.service";
import { stockService } from "../../stock/services/stock.service";
import { auditService } from "@modules/audit/services/audit.service";
import { logger } from "@logging/logger";
import { cacheService } from "@cache/cache.service";
import { AppError } from "@common/constants/app.errors";
import { HttpStatusCode } from "@common/constants/http";
import { StockMovementType } from "@common/types/stockMovement.dto";


import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  CancelPurchaseOrderDto,
  LinkPaymentDto,
  PurchaseOrderResponseDto
} from '../types/purchaseOrder.dto';

import { eventBus } from '@events/eventBus';
import { EVENTS } from '@events/events';
import prisma from "@shared/infra/database/prisma";

export class PurchaseOrderService {
  private cacheKey(tenantId: string) {
    return `purchase_orders:${tenantId}`;
  }

  async list(tenantId: string) {
    const key = this.cacheKey(tenantId);
    const cached = await cacheService.get<PurchaseOrderResponseDto[]>(key);
    if (cached) return cached;
    const data = await prisma.purchaseOrder.findMany({
      where: { tenantId },
      include: { items: true },
      orderBy: { orderDate: 'desc' },
    });
    await cacheService.set(key, data, 300);
    return data;
  }

  async getById(tenantId: string, id: string) {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!po) throw new AppError('Not found', 404);
    return po;
  }

  async create(
    tenantId: string,
    userId: string,
    dto: CreatePurchaseOrderDto
  ): Promise<PurchaseOrderResponseDto> {
    const rec = await prisma.purchaseOrder.create({
      data: {
        tenantId,
        supplierId: dto.supplierId,
        storeId: dto.storeId,
        warehouseId: dto.warehouseId,
        orderDate: dto.orderDate,
        receivedDate: dto.receivedDate,
        totalAmount: dto.totalAmount,
        notes: dto.notes,
        createdById: userId,
        items: {
          create: dto.items.map(item => ({
            tenantProductId:            item.tenantProductId,
            tenantProductVariantId:     item.tenantProductVariantId,
            quantity:                   item.quantity,
            costPrice:                  item.costPrice,
            batchNumber:                item.batchNumber,
            expiryDate:                 item.expiryDate,
          })),
        },
      },
      include: { items: true },
    });

    await cacheService.del(this.cacheKey(tenantId));
    await auditService.log({
      tenantId,
      userId,
      module: 'PurchaseOrder',
      action: 'create',
      entityId: rec.id,
      details: dto,
    });
    eventBus.emit(EVENTS.PURCHASE_ORDER_CREATED, rec);
    return rec;
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdatePurchaseOrderDto
  ) {
    const existing = await this.getById(tenantId, id);
    const rec = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status:       dto.status,
        receivedDate: dto.receivedDate,
        notes:        dto.notes,
        updatedById:  userId,
      },
      include: { items: true },
    });
    await cacheService.del(this.cacheKey(tenantId));
    await auditService.log({
      tenantId,
      userId,
      module: 'PurchaseOrder',
      action: 'update',
      entityId: id,
      details: dto,
    });
    eventBus.emit(EVENTS.PURCHASE_ORDER_UPDATED, rec);
    return rec;
  }

  async cancel(
    tenantId: string,
    userId: string,
    id: string,
    dto: CancelPurchaseOrderDto
  ) {
    const existing = await this.getById(tenantId, id);
    if (existing.status === 'cancelled')
      throw new AppError('Already cancelled', 400);
    const rec = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status:      'cancelled',
        updatedById: userId,
        notes:       dto.reason ?? existing.notes,
      },
      include: { items: true },
    });
    await cacheService.del(this.cacheKey(tenantId));
    await auditService.log({
      tenantId,
      userId,
      module: 'PurchaseOrder',
      action: 'cancel',
      entityId: id,
      details: dto,
    });
    eventBus.emit(EVENTS.PURCHASE_ORDER_CANCELLED, rec);
    return rec;
  }

  async linkPayment(
    tenantId: string,
    userId: string,
    id: string,
    dto: LinkPaymentDto
  ) {
    // attach Payment to PO
    const rec = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        payments: {
          create: {
            paymentId: dto.paymentId,
            amount:    dto.amount,
            createdBy: { connect: { id: userId } },
          },
        },
        updatedById: userId,
      },
      include: { items: true, payments: true },
    });
    await cacheService.del(this.cacheKey(tenantId));
    await auditService.log({
      tenantId,
      userId,
      module: 'PurchaseOrder',
      action: 'linkPayment',
      entityId: id,
      details: dto,
    });
    eventBus.emit(EVENTS.PURCHASE_ORDER_PAYMENT_LINKED, rec);
    return rec;
  }
}

export const purchaseOrderService = new PurchaseOrderService();
