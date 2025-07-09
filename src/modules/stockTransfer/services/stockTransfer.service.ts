// src/modules/stockTransfer/services/stockTransfer.service.ts

import {
  CreateStockTransferDto,
  ApproveStockTransferDto,
  RejectStockTransferDto,
  CancelStockTransferDto,
  StockTransferResponseDto,
} from '../types/stockTransfer.dto';
import { cacheService } from '@cache/cache.service';
import { auditService } from '@modules/audit/services/audit.service';
import { eventBus } from '@events/eventBus';
import { EVENTS } from '@events/events';
import { AppError } from '@common/constants/app.errors';
import prisma from '@shared/infra/database/prisma';
import { b2bConnectionService } from '@modules/b2b/services/b2bConnection.service';

export class StockTransferService {
  private cacheKey(tenantId: string) {
    return `stock_transfers:${tenantId}`;
  }

  async list(tenantId: string) {
    const key = this.cacheKey(tenantId);
    const cached = await cacheService.get<StockTransferResponseDto[]>(key);
    if (cached) return cached;
    const transfers = await prisma.stockTransfer.findMany({
      where: { tenantId },
    });
    await cacheService.set(key, transfers, 300);
    return transfers;
  }

  async getById(tenantId: string, id: string) {
    const transfer = await prisma.stockTransfer.findUnique({ where: { id } });
    if (!transfer || transfer.tenantId !== tenantId) throw new AppError('Not found', 404);
    return transfer;
  }



  async requestTransfer(
    tenantId: string,
    userId: string,
    dto: CreateStockTransferDto
  ): Promise<StockTransferResponseDto> {
    // 1. Check B2B connection status
    const conn = await b2bConnectionService.findConnection(
      tenantId,
      dto.destTenantId
    );
    if (!conn || conn.status !== 'approved' || !conn.isActive) {
      throw new AppError(
        'No active, approved B2B connection between these tenants',
        403
      );
    }

    // 2. (Optional) ensure dest tenant has created a PO for this product
    const hasPO = await prisma.purchaseOrderItem.findFirst({
      where: {
        purchaseOrder: {
          tenantId: dto.destTenantId,
          status: { in: ['approved','received'] },
        },
        tenantProductId: dto.sourceTenantProductId,
      },
    });
    if (!hasPO) {
      throw new AppError(
        'Destination tenant must first create an approved purchase order for this product',
        400
      );
    }

    // now safe to create
    const record = await prisma.stockTransfer.create({
      data: { tenantId, status: 'pending', createdById: userId, ...dto },
    });
   await cacheService.del(this.cacheKey(tenantId));
    await auditService.log({
      tenantId,
      userId,
      module: 'StockTransfer',
      action: 'create',
      entityId: record.id,
      details: dto,
    });
    eventBus.emit(EVENTS.STOCK_TRANSFER_REQUESTED, record);
    return record;
  }

  async approveTransfer(
    tenantId: string,
    userId: string,
    id: string,
    dto: ApproveStockTransferDto
  ): Promise<StockTransferResponseDto> {
    const t = await this.getById(tenantId, id);
    if (t.status !== 'pending' || t.destTenantId !== tenantId) throw new AppError('Forbidden or wrong status', 403);
    const conn = await b2bConnectionService.findConnection(
      t.tenantId,
      t.destTenantId
    );
    if (!conn || conn.status !== 'approved' || !conn.isActive) {
      throw new AppError(
        'Cannot approve: B2B connection is not active/approved',
        403
      );
    }
    // 2. (Optional) ensure dest tenant has created a PO for this product
    const hasPO = await prisma.purchaseOrderItem.findFirst({
      where: {
        purchaseOrder: {
          tenantId: dto.destTenantId,
          status: { in: ['approved','received'] },
        },
        tenantProductId: dto.sourceTenantProductId,
      },
    });
    if (!hasPO) {
      throw new AppError(
        'Destination tenant must first create an approved purchase order for this product',
        400
      );
    }
    const updated = await prisma.stockTransfer.update({
      where: { id },
      data: { status: 'approved', approvedById: userId },
    });


    await cacheService.del(this.cacheKey(t.tenantId));
    await auditService.log({
      tenantId,
      userId,
      module: 'StockTransfer',
      action: 'approve',
      entityId: id,
      details: dto,
    });
    eventBus.emit(EVENTS.STOCK_TRANSFER_APPROVED, updated);
    return updated;
  }

  async rejectTransfer(
    tenantId: string,
    userId: string,
    id: string,
    dto: RejectStockTransferDto
  ): Promise<StockTransferResponseDto> {
    const t = await this.getById(tenantId, id);
    if (t.status !== 'pending' || t.destTenantId !== tenantId) throw new AppError('Forbidden or wrong status', 403);
    const updated = await prisma.stockTransfer.update({
      where: { id },
      data: { status: 'rejected' },
    });
    await cacheService.del(this.cacheKey(t.tenantId));
    await auditService.log({
      tenantId,
      userId,
      module: 'StockTransfer',
      action: 'reject',
      entityId: id,
      details: dto,
    });
    eventBus.emit(EVENTS.STOCK_TRANSFER_REJECTED, updated);
    return updated;
  }


  async cancelTransfer(
    tenantId: string,
    userId: string,
    id: string,
    dto: CancelStockTransferDto
  ) {
    const t = await this.getById(tenantId, id);
    if (!['pending','approved'].includes(t.status)) throw new AppError('Cannot cancel', 400);
    if (t.sourceTenantProductId !== tenantId && t.destTenantId !== tenantId)
      throw new AppError('Forbidden', 403);
    const updated = await prisma.stockTransfer.update({
      where: { id },
      data: { status: 'cancelled' },
    });
    await cacheService.del(this.cacheKey(t.tenantId));
    await auditService.log({
      tenantId,
      userId,
      module: 'StockTransfer',
      action: 'cancel',
      entityId: id,
      details: dto,
    });
    eventBus.emit(EVENTS.STOCK_TRANSFER_CANCELED, updated);
    return updated;
  }
}

export const stockTransferService = new StockTransferService();
