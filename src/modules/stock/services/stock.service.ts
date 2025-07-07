// src/modules/stock/services/stock.service.ts
import { PrismaClient } from "@prisma/client";
import { cacheService, CacheService } from "@cache/cache.service";
import { auditService, AuditService } from "@modules/audit/types/audit.service";
import { eventEmitter, EventEmitter } from "@events/event.emitter";
import {
  StockLevelDto,
  StockResponseDto,
  StockAdjustmentDto,
  StockIncrementDto,
  StockFilterOptions,
} from "../types/stock.dto";
import { StockMovementType } from "@common/types/stockMovement.dto";
import { ConflictError, NotFoundError, DatabaseError } from "@middleware/errors";
import prisma from "@shared/infra/database/prisma";

export class StockService {
  private readonly STOCK_CACHE_TTL = 60 * 2;


  async getStockLevels(
    tenantId: string,
    filters: StockFilterOptions = {}
  ): Promise<{ data: StockResponseDto[]; pagination: any }> {
    const {
      page = 1,
      limit = 10,
      productId,
      variantId,
      storeId,
      warehouseId,
      minQuantity,
      maxQuantity,
      lowStockOnly,
    } = filters;

    const where: any = { tenantId };

    if (productId) where.productId = productId;
    if (variantId) where.productVariantId = variantId;
    if (storeId) where.storeId = storeId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (minQuantity !== undefined) where.quantity = { gte: minQuantity };
    if (maxQuantity !== undefined) where.quantity = { lte: maxQuantity };
    if (lowStockOnly) {
      where.reorderPoint = { not: null };
      where.quantity = { lte: prisma.stock.fields.reorderPoint };
    }

    const [total, stocks] = await Promise.all([
      prisma.stock.count({ where }),
      prisma.stock.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              sellingPrice: true,
              isPrescription: true,
              controlledSubstance: true,
            },
          },
          productVariant: {
            select: {
              name: true,
              sku: true,
              sellingPrice: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          warehouse: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return {
      data: stocks.map((stock) => ({
        id: stock.id,
        tenantId: stock.tenantId,
        product: {
          id: stock.productId,
          name: stock.product.name,
          sku: stock.product.sku,
          sellingPrice: stock.product.sellingPrice,
          isPrescription: stock.product.isPrescription,
          controlledSubstance: stock.product.controlledSubstance,
        },
        variant: stock.productVariantId
          ? {
              id: stock.productVariantId,
              name: stock.productVariant?.name || "",
              sku: stock.productVariant?.sku || "",
              sellingPrice: stock.productVariant?.sellingPrice || 0,
            }
          : undefined,
        store: stock.storeId
          ? {
              id: stock.storeId,
              name: stock.store?.name || "",
              type: stock.store?.type,
            }
          : undefined,
        warehouse: stock.warehouseId
          ? {
              id: stock.warehouseId,
              name: stock.warehouse?.name || "",
            }
          : undefined,
        quantity: stock.quantity,
        minStockLevel: stock.minStockLevel ?? undefined,
        maxStockLevel: stock.maxStockLevel ?? undefined,
        reorderPoint: stock.reorderPoint ?? undefined,
        updatedAt: stock.updatedAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStock(
    tenantId: string,
    productId: string,
    options: {
      variantId?: string;
      storeId?: string;
      warehouseId?: string;
    } = {}
  ): Promise<StockLevelDto | null> {
    const { variantId, storeId, warehouseId } = options;
    // Use a public method to generate the cache key, or make generateStockKey public in CacheService
    const cacheKey = cacheService.generateStockKey(
      tenantId,
      productId,
      { variantId, storeId, warehouseId },
    );

    try {
      const cachedStock = await cacheService.get<StockLevelDto>(cacheKey);
      if (cachedStock) return cachedStock;

      const stock = await prisma.stock.findFirst({
        where: {
          tenantId,
          productId,
          productVariantId: variantId,
          storeId,
          warehouseId,
        },
      });

      if (!stock) return null;

      const stockDto: StockLevelDto = {
        id: stock.id,
        tenantId: stock.tenantId,
        productId: stock.productId,
        variantId: stock.productVariantId ?? undefined,
        storeId: stock.storeId ?? undefined,
        warehouseId: stock.warehouseId ?? undefined,
        quantity: stock.quantity,
        minStockLevel: stock.minStockLevel ?? undefined,
        maxStockLevel: stock.maxStockLevel ?? undefined,
        reorderPoint: stock.reorderPoint ?? undefined,
        updatedAt: stock.updatedAt,
      };

      await cacheService.set(cacheKey, stockDto, this.STOCK_CACHE_TTL);
      return stockDto;
    } catch (err) {
      throw new DatabaseError("Failed to retrieve stock");
    }
  }

  async adjustStockLevel(dto: StockAdjustmentDto, userId: string): Promise<StockLevelDto> {
    return prisma.$transaction(async (tx) => {
      if (dto.quantity < 0) {
        throw new ConflictError("Stock quantity cannot be negative");
      }

      const stock = await tx.stock.upsert({
        where: {
          tenantId_productId_storeId_warehouseId: {
            tenantId: dto.tenantId,
            productId: dto.productId,
            storeId: dto.storeId || null,
            warehouseId: dto.warehouseId || null,
          },
        },
        update: {
          quantity: dto.quantity,
          updatedAt: new Date(),
        },
        create: {
          tenantId: dto.tenantId,
          productId: dto.productId,
          productVariantId: dto.variantId,
          storeId: dto.storeId,
          warehouseId: dto.warehouseId,
          quantity: dto.quantity,
          updatedAt: new Date(),
        },
      });

      // Emit event for inventory movement
      await eventEmitter.emit("stock:adjusted", {
        tenantId: dto.tenantId,
        productId: dto.productId,
        variantId: dto.variantId,
        storeId: dto.storeId,
        warehouseId: dto.warehouseId,
        quantity: dto.quantity,
        movementType: dto.movementType || StockMovementType.ADJUSTMENT,
        reference: dto.reference || `STOCK_ADJUST_${stock.id}`,
        batchNumber: dto.batchNumber,
        expiryDate: dto.expiryDate,
        userId,
      });

      await auditService.log({
        userId,
        tenantId: dto.tenantId,
        action: "UPDATE",
        entityType: "Stock",
        entityId: stock.id,
        metadata: {
          productId: dto.productId,
          quantity: dto.quantity,
          action: "adjust",
          reason: dto.reason,
        },
      });

      await cacheService.invalidateStock(
        dto.tenantId,
        dto.productId,
        dto.variantId,
        { storeId: dto.storeId, warehouseId: dto.warehouseId }
      );

      return {
        id: stock.id,
        tenantId: stock.tenantId,
        productId: stock.productId,
        variantId: stock.productVariantId ?? undefined,
        storeId: stock.storeId ?? undefined,
        warehouseId: stock.warehouseId ?? undefined,
        quantity: stock.quantity,
        updatedAt: stock.updatedAt,
      };
    });
  }

  async incrementStockLevel(dto: StockIncrementDto, userId: string): Promise<StockLevelDto> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.stock.findFirst({
        where: {
          tenantId: dto.tenantId,
          productId: dto.productId,
          productVariantId: dto.variantId,
          storeId: dto.storeId,
          warehouseId: dto.warehouseId,
        },
      });

      let stock;
      if (existing) {
        const newQuantity = existing.quantity + dto.delta;
        if (newQuantity < 0) {
          throw new ConflictError("Stock quantity cannot be negative");
        }

        stock = await tx.stock.update({
          where: { id: existing.id },
          data: {
            quantity: newQuantity,
            updatedAt: new Date(),
          },
        });
      } else {
        if (dto.delta < 0) {
          throw new ConflictError("Cannot decrement non-existent stock");
        }

        stock = await tx.stock.create({
          data: {
            tenantId: dto.tenantId,
            productId: dto.productId,
            productVariantId: dto.variantId,
            storeId: dto.storeId,
            warehouseId: dto.warehouseId,
            quantity: dto.delta,
            updatedAt: new Date(),
          },
        });
      }

      // Emit event for inventory movement
      await eventEmitter.emit("stock:updated", {
        tenantId: dto.tenantId,
        productId: dto.productId,
        variantId: dto.variantId,
        storeId: dto.storeId,
        warehouseId: dto.warehouseId,
        quantity: dto.delta,
        movementType: dto.movementType || 
          (dto.delta > 0 ? StockMovementType.PURCHASE : StockMovementType.SALE),
        reference: dto.reference || `STOCK_${dto.delta > 0 ? "INC" : "DEC"}_${stock.id}`,
        batchNumber: dto.batchNumber,
        expiryDate: dto.expiryDate,
        userId,
      });

      await auditService.log({
        userId,
        tenantId: dto.tenantId,
        action: "UPDATE",
        entityType: "Stock",
        entityId: stock.id,
        metadata: {
          productId: dto.productId,
          delta: dto.delta,
          newQuantity: stock.quantity,
          reason: dto.reason,
        },
      });

      await cacheService.invalidateStock(
        dto.tenantId,
        dto.productId,
        dto.variantId,
        { storeId: dto.storeId, warehouseId: dto.warehouseId }
      );

      return {
        id: stock.id,
        tenantId: stock.tenantId,
        productId: stock.productId,
        variantId: stock.productVariantId ?? undefined,
        storeId: stock.storeId ?? undefined,
        warehouseId: stock.warehouseId ?? undefined,
        quantity: stock.quantity,
        updatedAt: stock.updatedAt,
      };
    });
  }

  async deleteStock(
    tenantId: string,
    productId: string,
    options: {
      storeId?: string;
      warehouseId?: string;
    },
    userId: string
  ): Promise<void> {
    return prisma.$transaction(async (tx) => {
      const { storeId, warehouseId } = options;

      const stock = await tx.stock.findFirst({
        where: {
          tenantId,
          productId,
          storeId,
          warehouseId,
        },
      });

      if (!stock) {
        throw new NotFoundError("Stock record");
      }

      if (stock.quantity > 0) {
        throw new ConflictError("Cannot delete stock record with positive quantity");
      }

      await tx.stock.deleteMany({
        where: {
          tenantId,
          productId,
          storeId,
          warehouseId,
        },
      });

      await auditService.log({
        userId,
        tenantId,
        action: "DELETE",
        entityType: "Stock",
        entityId: stock.id,
        metadata: {
          productId,
          storeId,
          warehouseId,
        },
      });

      await cacheService.invalidateStock(tenantId, productId, undefined, {
        storeId,
        warehouseId,
      });
    });
  }
}

export const stockService = new StockService();