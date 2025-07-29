// src/modules/stockTransfer/services/stockTransfer.service.ts
import {
  CreateStockTransferDto,
  ApproveStockTransferDto,
  RejectStockTransferDto,
  CancelStockTransferDto,
  StockTransferResponseDto,
  StockTransferStatus,
  StockTransferType,
} from '../types/stockTransfer.dto';
import { cacheService } from '@cache/cache.service';
import { auditService } from '@modules/audit/services/audit.service';
import { eventBus } from '@events/eventBus';
import { EVENTS } from '@events/events';
import { AppError } from '@common/constants/app.errors';
import prisma from '@shared/infra/database/prisma';
import { b2bConnectionService } from '@modules/b2b/services/b2bConnection.service';
import { inventoryService } from '@modules/inventory/services/inventory.service';
import { inventoryFlowService } from '@modules/inventory/services/inventoryFlow.service';

export class StockTransferService {
  private cacheKey(tenantId: string) {
    return `stock_transfers:${tenantId}`;
  }

  async list(tenantId: string, filters: any = {}) {
    const key = `${this.cacheKey(tenantId)}:${JSON.stringify(filters)}`;
    const cached = await cacheService.get<StockTransferResponseDto[]>(key);
    if (cached) return cached;

    const where: any = { tenantId };
    Object.entries(filters).forEach(([key, value]) => {
      if (value) where[key] = value;
    });

    const transfers = await prisma.stockTransfer.findMany({
      where,
      include: { items: true }
    });
    
    await cacheService.set(key, transfers, 300);
    return transfers;
  }

  async getById(tenantId: string, id: string) {
    const transfer = await prisma.stockTransfer.findUnique({ 
      where: { id },
      include: { items: true }
    });
    
    if (!transfer || transfer.tenantId !== tenantId) {
      throw new AppError('Stock transfer not found', 404);
    }
    
    return transfer;
  }

  async requestTransfer(
    tenantId: string,
    userId: string,
    dto: CreateStockTransferDto
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Validate B2B connection for cross-tenant transfers
      if (dto.transferType === 'CROSS_TENANT') {
        const conn = await b2bConnectionService.findConnection(
          tenantId,
          dto.destTenantId
        );
        
        if (!conn || conn.status !== 'APPROVED') {
          throw new AppError(
            'No active B2B connection between tenants',
            403
          );
        }
      }

      // 2. Validate inventory availability
      for (const item of dto.items) {
        const args = { tenantId, productId:item.sourceTenantProductId, productVariantId: item.sourceTenantProductVariantId,  quantity:item.quantity, storeId:dto.fromStoreId } 
        const available = await inventoryService.checkAvailability(args);
        
        if (!available) {
          throw new AppError(
            `Insufficient stock for product ${item.sourceTenantProductId}`,
            400
          );
        }
      }

      // 3. Create transfer record
      const transfer = await tx.stockTransfer.create({
        data: {
          tenantId,
          createdById: userId,
          status: 'PENDING',
          ...dto,
          items: {
            create: dto.items.map(item => ({
              sourceTenantProductId: item.sourceTenantProductId,
              sourceTenantProductVariantId: item.sourceTenantProductVariantId,
              destTenantProductId: item.tenantProductId,
              destTenantProductVariantId: item.destTenantProductVariantId,
              quantity: item.quantity,
              batchNumber: item.batchNumber,
              expiryDate: item.expiryDate,
              name: item.name,
              sku: item.sku
            }))
          }
        },
        include: { items: true }
      });

      const transferData = {
        transferId: transfer.id,
        items: dto.items,
        tenantId,
      }
      // 4. Reserve inventory
      await inventoryService.reserveStockForTransfer(
        tenantId,
        userId,
        transferData
      );

      // 5. Clear cache and emit event
      await cacheService.del(this.cacheKey(tenantId));
      await auditService.log({
        tenantId,
        userId,
        module: 'StockTransfer',
        action: 'create',
        entityId: transfer.id,
        details: dto,
      });
      
      eventBus.emit(EVENTS.STOCK_TRANSFER_REQUESTED, transfer);
      return transfer;
    });
  }

  async approveTransfer(
    tenantId: string,
    userId: string,
    id: string,
    dto: ApproveStockTransferDto
  ) {
    return prisma.$transaction(async (tx) => {
      const transfer = await this.getById(tenantId, id);
      
      if (transfer.status !== 'PENDING' || transfer.destTenantId !== tenantId) {
        throw new AppError('Transfer cannot be approved', 403);
      }

      // 1. Update transfer status
      const updated = await tx.stockTransfer.update({
        where: { id },
        data: { 
          status: 'APPROVED', 
          approvedById: userId 
        },
        include: { items: true }
      });

      // 2. Process inventory transfer
      await inventoryFlowService.processStockTransfer(tenantId, userId, updated?.items);

      // 3. Clear cache and emit event
      await cacheService.del(this.cacheKey(transfer.tenantId));
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
    });
  }

  async rejectTransfer(
    tenantId: string,
    userId: string,
    id: string,
    dto: RejectStockTransferDto
  ) {
    return prisma.$transaction(async (tx) => {
      const transfer = await this.getById(tenantId, id);
      
      if (transfer.status !== 'PENDING' || transfer.destTenantId !== tenantId) {
        throw new AppError('Transfer cannot be rejected', 403);
      }

      const updated = await tx.stockTransfer.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      // Release reserved stock
      await inventoryService.releaseReservedStock(
        transfer.tenantId, 
        transfer.id
      );

      await cacheService.del(this.cacheKey(transfer.tenantId));
      await auditService.log({
        tenantId,
        userId,
        module: 'StockTransfer',
        action: 'reject',
        entityId: id,
        details: dto,
      });
      
      eventBus.emit(EVENTS.STOCK_TRANSFER_REJECTED, {
        ...updated,
        reason: dto.reason
      });
      return updated;
    });
  }

  async cancelTransfer(
    tenantId: string,
    userId: string,
    id: string,
    dto: CancelStockTransferDto
  ) {
    return prisma.$transaction(async (tx) => {
      const transfer = await this.getById(tenantId, id);
      
      if (!['PENDING','APPROVED'].includes(transfer.status)) {
        throw new AppError('Transfer cannot be cancelled', 400);
      }

      if (transfer.tenantId !== tenantId && transfer.destTenantId !== tenantId) {
        throw new AppError('Unauthorized cancellation', 403);
      }

      const updated = await tx.stockTransfer.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // Release reserved stock if not completed
      if (transfer.status !== 'COMPLETED') {
        await inventoryService.releaseReservedStock(
          transfer.tenantId, 
          transfer.id
        );
      }

      await cacheService.del(this.cacheKey(transfer.tenantId));
      await auditService.log({
        tenantId,
        userId,
        module: 'StockTransfer',
        action: 'cancel',
        entityId: id,
        details: dto,
      });
      
      eventBus.emit(EVENTS.STOCK_TRANSFER_CANCELLED, {
        ...updated,
        reason: dto.reason
      });
      return updated;
    });
  }

  async completeTransfer(tenantId: string, transferId: string) {
    const transfer = await this.getById(tenantId, transferId);
    
    if (transfer.status !== 'APPROVED') {
      throw new AppError('Only approved transfers can be completed', 400);
    }

    const updated = await prisma.stockTransfer.update({
      where: { id: transferId },
      data: { status: 'COMPLETED' },
    });

    eventBus.emit(EVENTS.STOCK_TRANSFER_COMPLETED, updated);
    return updated;
  }
}

export const stockTransferService = new StockTransferService();