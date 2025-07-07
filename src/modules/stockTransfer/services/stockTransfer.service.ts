// modules/stockTransfer/services/stockTransfer.service.ts
import { PrismaClient } from "@prisma/client";
import { 
  CreateStockTransferDto,
  ApproveStockTransferDto,
  RejectStockTransferDto,
  CancelStockTransferDto,
  StockTransferResponseDto,
  ListStockTransfersDto
} from "../types/stockTransfer.dto";
import { inventoryService } from "../../inventory/services/inventory.service";
import { stockService } from "../../stock/services/stock.service";
import { auditService } from "@modules/audit/types/audit.service";
import { eventEmitter } from "@events/event.emitter";
import { logger } from "@logging/logger";
import { cacheService } from "@cache/cache.service";
import { AppError } from "@common/constants/app.errors";
import { HttpStatusCode } from "@common/constants/http";
import { StockMovementType } from "@common/types/stockMovement.dto";

const prisma = new PrismaClient();

export class StockTransferService {
  private readonly CACHE_TTL = 60 * 10; // 10 minutes

  async createTransfer(dto: CreateStockTransferDto): Promise<StockTransferResponseDto> {
    return prisma.$transaction(async (tx) => {
      // Validate product exists and is active
      const product = await tx.product.findUnique({
        where: { id: dto.productId },
        select: { isActive: true, isControlled: true }
      });

      if (!product || !product.isActive) {
        throw new AppError('Product not found or inactive', HttpStatusCode.BAD_REQUEST);
      }

      // For controlled substances, validate additional requirements
      if (product.isControlled) {
        if (!dto.batchNumber) {
          throw new AppError('Batch number required for controlled substances', HttpStatusCode.BAD_REQUEST);
        }
      }

      // Validate sufficient stock exists at source
      if (dto.fromStoreId || dto.fromWarehouseId) {
        const stock = await tx.stock.findFirst({
          where: {
            tenantId: dto.tenantId,
            productId: dto.productId,
            storeId: dto.fromStoreId || null,
            warehouseId: dto.fromWarehouseId || null
          }
        });

        if (!stock || stock.quantity < dto.quantity) {
          throw new AppError('Insufficient stock for transfer', HttpStatusCode.BAD_REQUEST);
        }
      }

      // Create the transfer
      const transfer = await tx.stockTransfer.create({
        data: {
          tenantId: dto.tenantId,
          fromStoreId: dto.fromStoreId,
          fromWarehouseId: dto.fromWarehouseId,
          toTenantId: dto.toTenantId,
          toStoreId: dto.toStoreId,
          toWarehouseId: dto.toWarehouseId,
          productId: dto.productId,
          quantity: dto.quantity,
          transferType: dto.transferType,
          b2bConnectionId: dto.b2bConnectionId,
          requestedBy: dto.requestedBy,
          notes: dto.notes,
          batchNumber: dto.batchNumber,
          expiryDate: dto.expiryDate,
          status: "pending"
        },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              isControlled: true
            }
          },
          fromStore: true,
          toStore: true,
          fromWarehouse: true,
          toWarehouse: true,
          b2bConnection: true,
          requestedByUser: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Audit log
      await auditService.log({
        userId: dto.requestedBy,
        tenantId: dto.tenantId,
        action: "STOCK_TRANSFER_CREATED",
        entityType: "StockTransfer",
        entityId: transfer.id,
        metadata: {
          productId: dto.productId,
          quantity: dto.quantity,
          fromLocation: dto.fromStoreId ? `store:${dto.fromStoreId}` : `warehouse:${dto.fromWarehouseId}`,
          toLocation: dto.toStoreId ? `store:${dto.toStoreId}` : `warehouse:${dto.toWarehouseId}`
        }
      });

      // Emit event
      eventEmitter.emit("stockTransfer:created", {
        transferId: transfer.id,
        tenantId: dto.tenantId,
        toTenantId: dto.toTenantId,
        productId: dto.productId,
        quantity: dto.quantity,
        requestedBy: dto.requestedBy
      });

      return this.toResponseDto(transfer);
    });
  }

  async approveTransfer(transferId: string, dto: ApproveStockTransferDto): Promise<StockTransferResponseDto> {
    return prisma.$transaction(async (tx) => {
      // Get the transfer record with related data
      const transfer = await tx.stockTransfer.findUnique({
        where: { id: transferId },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              isControlled: true
            }
          },
          fromStore: true,
          toStore: true,
          fromWarehouse: true,
          toWarehouse: true,
          b2bConnection: true
        }
      });

      if (!transfer) {
        throw new AppError('Transfer not found', HttpStatusCode.NOT_FOUND);
      }

      if (transfer.status !== "pending") {
        throw new AppError('Transfer is not pending approval', HttpStatusCode.BAD_REQUEST);
      }

      // For cross-tenant transfers, validate B2B connection is active
      if (transfer.transferType === "cross-tenant" && transfer.b2bConnection?.status !== "approved") {
        throw new AppError('B2B connection is not approved', HttpStatusCode.BAD_REQUEST);
      }

      // Deduct from sender's inventory & stock
      await inventoryService.recordMovement({
        tenantId: transfer.tenantId,
        productId: transfer.productId,
        storeId: transfer.fromStoreId,
        warehouseId: transfer.fromWarehouseId,
        quantity: -transfer.quantity,
        movementType: StockMovementType.TRANSFER_OUT,
        userId: dto.approvedBy,
        reference: transfer.id,
        batchNumber: transfer.batchNumber,
        expiryDate: transfer.expiryDate,
        id: transfer.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await stockService.adjustStockLevel({
        tenantId: transfer.tenantId,
        productId: transfer.productId,
        storeId: transfer.fromStoreId,
        warehouseId: transfer.fromWarehouseId,
        quantity: -transfer.quantity
      }, dto.approvedBy);

      // Add to receiver's inventory & stock
      await inventoryService.recordMovement({
        tenantId: transfer.toTenantId || transfer.tenantId,
        productId: transfer.productId,
        quantity: transfer.quantity,
        movementType: StockMovementType.TRANSFER_IN,
        reference: transfer.id,
        batchNumber: transfer.batchNumber,
        expiryDate: transfer.expiryDate,
        userId: dto.approvedBy,
        destination: transfer.toStoreId
          ? { type: 'store', id: transfer.toStoreId }
          : transfer.toWarehouseId
            ? { type: 'warehouse', id: transfer.toWarehouseId }
            : undefined,
        metadata: {},
        id: transfer.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await stockService.adjustStockLevel({
        tenantId: transfer.toTenantId || transfer.tenantId,
        productId: transfer.productId,
        storeId: transfer.toStoreId,
        warehouseId: transfer.toWarehouseId,
        quantity: transfer.quantity
      }, dto.approvedBy);

      // Update transfer status
      const updatedTransfer = await tx.stockTransfer.update({
        where: { id: transferId },
        data: {
          status: "completed",
          approvedBy: dto.approvedBy,
          notes: dto.notes,
          updatedAt: new Date()
        },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              isControlled: true
            }
          },
          fromStore: true,
          toStore: true,
          fromWarehouse: true,
          toWarehouse: true,
          b2bConnection: true,
          requestedByUser: {
            select: {
              id: true,
              name: true
            }
          },
          approvedByUser: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Audit log
      await auditService.log({
        userId: dto.approvedBy,
        tenantId: transfer.tenantId,
        action: "STOCK_TRANSFER_APPROVED",
        entityType: "StockTransfer",
        entityId: transfer.id,
        metadata: {
          productId: transfer.productId,
          quantity: transfer.quantity
        }
      });

      // Emit event
      eventEmitter.emit("stockTransfer:approved", {
        transferId: transfer.id,
        tenantId: transfer.tenantId,
        toTenantId: transfer.toTenantId,
        productId: transfer.productId,
        quantity: transfer.quantity,
        approvedBy: dto.approvedBy,
        notes: dto.notes
      });

      // Invalidate cache
      await cacheService.invalidate(`stockTransfers:${transfer.tenantId}`);
      if (transfer.toTenantId) {
        await cacheService.invalidate(`stockTransfers:${transfer.toTenantId}`);
      }

      return this.toResponseDto(updatedTransfer);
    });
  }

  async rejectTransfer(transferId: string, dto: RejectStockTransferDto): Promise<StockTransferResponseDto> {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id: transferId },
        include: {
          product: {
            select: {
              name: true,
              sku: true
            }
          }
        }
      });

      if (!transfer) {
        throw new AppError('Transfer not found', HttpStatusCode.NOT_FOUND);
      }

      if (transfer.status !== "pending") {
        throw new AppError('Only pending transfers can be rejected', HttpStatusCode.BAD_REQUEST);
      }

      const updatedTransfer = await tx.stockTransfer.update({
        where: { id: transferId },
        data: {
          status: "rejected",
          approvedBy: dto.rejectedBy,
          notes: dto.notes,
          updatedAt: new Date()
        },
        include: {
          product: {
            select: {
              name: true,
              sku: true
            }
          },
          requestedByUser: {
            select: {
              id: true,
              name: true
            }
          },
          approvedByUser: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Audit log
      await auditService.log({
        userId: dto.rejectedBy,
        tenantId: transfer.tenantId,
        action: "STOCK_TRANSFER_REJECTED",
        entityType: "StockTransfer",
        entityId: transfer.id,
        metadata: {
          productId: transfer.productId,
          quantity: transfer.quantity,
          reason: dto.notes
        }
      });

      // Emit event
      eventEmitter.emit("stockTransfer:rejected", {
        transferId: transfer.id,
        tenantId: transfer.tenantId,
        productId: transfer.productId,
        quantity: transfer.quantity,
        rejectedBy: dto.rejectedBy,
        reason: dto.notes
      });

      // Invalidate cache
      await cacheService.invalidate(`stockTransfers:${transfer.tenantId}`);

      return this.toResponseDto(updatedTransfer);
    });
  }

  async cancelTransfer(transferId: string, dto: CancelStockTransferDto): Promise<StockTransferResponseDto> {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id: transferId },
        include: {
          product: {
            select: {
              name: true,
              sku: true
            }
          }
        }
      });

      if (!transfer) {
        throw new AppError('Transfer not found', HttpStatusCode.NOT_FOUND);
      }

      if (transfer.status !== "pending") {
        throw new AppError('Only pending transfers can be cancelled', HttpStatusCode.BAD_REQUEST);
      }

      const updatedTransfer = await tx.stockTransfer.update({
        where: { id: transferId },
        data: {
          status: "cancelled",
          approvedBy: dto.cancelledBy,
          notes: dto.notes,
          updatedAt: new Date()
        },
        include: {
          product: {
            select: {
              name: true,
              sku: true
            }
          },
          requestedByUser: {
            select: {
              id: true,
              name: true
            }
          },
          approvedByUser: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Audit log
      await auditService.log({
        userId: dto.cancelledBy,
        tenantId: transfer.tenantId,
        action: "STOCK_TRANSFER_CANCELLED",
        entityType: "StockTransfer",
        entityId: transfer.id,
        metadata: {
          productId: transfer.productId,
          quantity: transfer.quantity,
          reason: dto.notes
        }
      });

      // Emit event
      eventEmitter.emit("stockTransfer:cancelled", {
        transferId: transfer.id,
        tenantId: transfer.tenantId,
        productId: transfer.productId,
        quantity: transfer.quantity,
        cancelledBy: dto.cancelledBy,
        reason: dto.notes
      });

      // Invalidate cache
      await cacheService.invalidate(`stockTransfers:${transfer.tenantId}`);

      return this.toResponseDto(updatedTransfer);
    });
  }

  async listTransfers(filters: ListStockTransfersDto): Promise<{
    data: StockTransferResponseDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const cacheKey = `stockTransfers:${JSON.stringify(filters)}`;
    
    try {
      const cached = await cacheService.get<{
        data: StockTransferResponseDto[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>(cacheKey);
      if (cached) return cached;

      const where: any = {
        ...(filters.tenantId && { tenantId: filters.tenantId }),
        ...(filters.toTenantId && { toTenantId: filters.toTenantId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.productId && { productId: filters.productId }),
        ...(filters.transferType && { transferType: filters.transferType }),
        ...(filters.requestedBy && { requestedBy: filters.requestedBy }),
        ...(filters.approvedBy && { approvedBy: filters.approvedBy }),
        ...(filters.fromDate && { createdAt: { gte: new Date(filters.fromDate) } }),
        ...(filters.toDate && { createdAt: { lte: new Date(filters.toDate) } }),
      };

      // Handle store/warehouse filters - check both from and to locations
      if (filters.storeId) {
        where.OR = [
          { fromStoreId: filters.storeId },
          { toStoreId: filters.storeId }
        ];
      }

      if (filters.warehouseId) {
        where.OR = [
          { fromWarehouseId: filters.warehouseId },
          { toWarehouseId: filters.warehouseId }
        ];
      }

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const [total, transfers] = await Promise.all([
        prisma.stockTransfer.count({ where }),
        prisma.stockTransfer.findMany({
          where,
          skip,
          take: limit,
          include: {
            product: {
              select: {
                name: true,
                sku: true,
                isControlled: true
              }
            },
            fromStore: true,
            toStore: true,
            fromWarehouse: true,
            toWarehouse: true,
            b2bConnection: true,
            requestedByUser: {
              select: {
                id: true,
                name: true
              }
            },
            approvedByUser: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        })
      ]);

      const result = {
        data: transfers.map(this.toResponseDto),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };

      await cacheService.set(cacheKey, result, this.CACHE_TTL);
      return result;
    } catch (error) {
      logger.error("Failed to fetch stock transfers", { error });
      throw new AppError('Failed to fetch stock transfers', HttpStatusCode.INTERNAL_SERVER);
    }
  }

  async getTransferById(transferId: string): Promise<StockTransferResponseDto | null> {
    try {
      const transfer = await prisma.stockTransfer.findUnique({
        where: { id: transferId },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              isControlled: true
            }
          },
          fromStore: true,
          toStore: true,
          fromWarehouse: true,
          toWarehouse: true,
          b2bConnection: true,
          requestedByUser: {
            select: {
              id: true,
              name: true
            }
          },
          approvedByUser: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return transfer ? this.toResponseDto(transfer) : null;
    } catch (error) {
      logger.error("Failed to fetch stock transfer", { error });
      throw new AppError('Failed to fetch stock transfer', HttpStatusCode.INTERNAL_SERVER);
    }
  }

  async deleteTransfer(transferId: string): Promise<void> {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id: transferId }
      });

      if (!transfer) {
        throw new AppError('Transfer not found', HttpStatusCode.NOT_FOUND);
      }

      if (transfer.status === "completed") {
        throw new AppError('Cannot delete a completed transfer', HttpStatusCode.BAD_REQUEST);
      }

      await tx.stockTransfer.delete({ where: { id: transferId } });

      // Audit log
      await auditService.log({
        userId: transfer.requestedBy,
        tenantId: transfer.tenantId,
        action: "STOCK_TRANSFER_DELETED",
        entityType: "StockTransfer",
        entityId: transfer.id,
        metadata: {
          productId: transfer.productId,
          quantity: transfer.quantity,
          status: transfer.status
        }
      });

      // Emit event
      eventEmitter.emit("stockTransfer:deleted", {
        transferId: transfer.id,
        tenantId: transfer.tenantId,
        productId: transfer.productId,
        quantity: transfer.quantity
      });

      // Invalidate cache
      await cacheService.invalidate(`stockTransfers:${transfer.tenantId}`);
    });
  }

  private toResponseDto(transfer: any): StockTransferResponseDto {
    return {
      id: transfer.id,
      tenantId: transfer.tenantId,
      fromStore: transfer.fromStore ? {
        id: transfer.fromStore.id,
        name: transfer.fromStore.name
      } : undefined,
      fromWarehouse: transfer.fromWarehouse ? {
        id: transfer.fromWarehouse.id,
        name: transfer.fromWarehouse.name
      } : undefined,
      toTenant: transfer.toTenantId ? {
        id: transfer.toTenantId,
        name: transfer.b2bConnection?.tenantB?.name || 'Unknown Tenant'
      } : undefined,
      toStore: transfer.toStore ? {
        id: transfer.toStore.id,
        name: transfer.toStore.name
      } : undefined,
      toWarehouse: transfer.toWarehouse ? {
        id: transfer.toWarehouse.id,
        name: transfer.toWarehouse.name
      } : undefined,
      product: {
        id: transfer.productId,
        name: transfer.product.name,
        sku: transfer.product.sku,
        isControlled: transfer.product.isControlled
      },
      quantity: transfer.quantity,
      transferType: transfer.transferType,
      b2bConnection: transfer.b2bConnection ? {
        id: transfer.b2bConnection.id,
        status: transfer.b2bConnection.status
      } : undefined,
      requestedBy: {
        id: transfer.requestedBy,
        name: transfer.requestedByUser?.name || 'Unknown User'
      },
      approvedBy: transfer.approvedBy ? {
        id: transfer.approvedBy,
        name: transfer.approvedByUser?.name || 'Unknown User'
      } : undefined,
      notes: transfer.notes,
      status: transfer.status,
      createdAt: transfer.createdAt,
      updatedAt: transfer.updatedAt
    };
  }
}

export const stockTransferService = new StockTransferService();