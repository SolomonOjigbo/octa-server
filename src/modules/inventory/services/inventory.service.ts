import { PrismaClient } from "@prisma/client";
import { 
  InventoryMovementDto,
  InventoryResponseDto,
  PaginatedInventory,
} from "../types/inventory.dto";
import { cacheService } from "@cache/cache.service";
import { auditService } from "@modules/audit/services/audit.service";
import { eventEmitter } from "@events/event.emitter";
import { StockMovementType } from "@common/types/stockMovement.dto";
import { logger } from "@logging/logger";

const prisma = new PrismaClient();

export class InventoryService {
  private readonly INVENTORY_CACHE_TTL = 60 * 15; // 15 minutes

  async recordMovement(dto: InventoryMovementDto): Promise<InventoryResponseDto> {
    return prisma.$transaction(async (tx) => {
      // Validate controlled substances
      if (dto.metadata?.prescriptionId) {
        await this.validateControlledSubstance(
          dto.productId, 
          dto.quantity,
          dto.metadata.pharmacistId
        );
      }

      const movement = await tx.inventory.create({
        data: {
          tenantId: dto.tenantId,
          productId: dto.productId,
          productVariantId: dto.variantId,
          batchNumber: dto.batchNumber,
          quantity: dto.quantity,
          costPrice: dto.costPrice,
          expiryDate: dto.expiryDate,
          movementType: dto.movementType,
          reference: dto.reference,
          storeId: dto.destination?.type === 'store' ? dto.destination.id : null,
          warehouseId: dto.destination?.type === 'warehouse' ? dto.destination.id : null,
          metadata: {
            ...dto.metadata,
            temperature: dto.metadata?.temperatureLog?.avg
          },
          createdById: dto.userId
        },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              isControlled: true
            }
          },
          store: true,
          warehouse: true
        }
      });

      // Emit event
      eventEmitter.emit("inventory:movement", {
        tenantId: dto.tenantId,
        productId: dto.productId,
        variantId: dto.variantId,
        quantity: dto.quantity,
        movementType: dto.movementType,
        batchNumber: dto.batchNumber,
        expiryDate: dto.expiryDate,
        userId: dto.userId,
        metadata: {
          prescriptionId: dto.metadata?.prescriptionId,
          previousQuantity: await this.getCurrentQuantity(dto),
          newQuantity: dto.quantity
        }
      });

      // Audit log
      await auditService.log({
        userId: dto.userId,
        tenantId: dto.tenantId,
        action: "INVENTORY_MOVEMENT",
        entityType: "Inventory",
        entityId: movement.id,
        metadata: {
          productId: dto.productId,
          movementType: dto.movementType,
          quantity: dto.quantity,
          isControlled: movement.product.isControlled
        }
      });

      // Invalidate cache
      await cacheService.invalidateInventory(dto.tenantId, dto.productId);

      return this.toResponseDto(movement);
    });
  }

  async getMovements(
    tenantId: string,
    filters: any
  ): Promise<PaginatedInventory> {
    const cacheKey = `inventory:movements:${tenantId}:${JSON.stringify(filters)}`;
    
    try {
      const cached = await cacheService.get<PaginatedInventory>(cacheKey);
      if (cached) return cached;

      const { page = 1, limit = 20, ...where } = filters;
      const skip = (page - 1) * limit;

      const [total, movements] = await Promise.all([
        prisma.inventory.count({ where: { tenantId, ...where } }),
        prisma.inventory.findMany({
          where: { tenantId, ...where },
          skip,
          take: limit,
          include: {
            product: {
              select: {
                name: true,
                sku: true
              }
            },
            store: true,
            warehouse: true
          },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      const result = {
        data: movements.map(this.toResponseDto),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };

      await cacheService.set(cacheKey, result, this.INVENTORY_CACHE_TTL);
      return result;
    } catch (error) {
      logger.error("Failed to fetch inventory movements", { error });
      throw new Error("Failed to fetch inventory movements");
    }
  }

  async getMovementById(tenantId: string, id: string): Promise<InventoryResponseDto | null> {
    try {
      const movement = await prisma.inventory.findFirst({
        where: { id, tenantId },
        include: {
          product: {
            select: {
              name: true,
              sku: true
            }
          },
          store: true,
          warehouse: true
        }
      });

      return movement ? this.toResponseDto(movement) : null;
    } catch (error) {
      logger.error("Failed to fetch inventory movement", { error });
      throw new Error("Failed to fetch inventory movement");
    }
  }

  private async validateControlledSubstance(
    productId: string,
    quantity: number,
    pharmacistId?: string
  ): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { isControlled: true }
    });

    if (product?.isControlled) {
      if (!pharmacistId) {
        throw new Error("Pharmacist ID required for controlled substances");
      }
      if (quantity <= 0) {
        throw new Error("Negative quantities not allowed for controlled substances");
      }
    }
  }

  private toResponseDto(movement: any): InventoryResponseDto {
    return {
      id: movement.id,
      tenantId: movement.tenantId,
      product: {
        id: movement.productId,
        name: movement.product.name,
        sku: movement.product.sku
      },
      variant: movement.productVariantId ? {
        id: movement.productVariantId,
        name: movement.productVariant?.name || '',
        sku: movement.productVariant?.sku || ''
      } : undefined,
      location: movement.storeId ? {
        type: 'store',
        id: movement.storeId,
        name: movement.store?.name || ''
      } : {
        type: 'warehouse',
        id: movement.warehouseId || '',
        name: movement.warehouse?.name || ''
      },
      batchNumber: movement.batchNumber || undefined,
      quantity: movement.quantity,
      costPrice: movement.costPrice || undefined,
      expiryDate: movement.expiryDate || undefined,
      movementType: movement.movementType,
      reference: movement.reference || undefined,
      createdAt: movement.createdAt,
      updatedAt: movement.updatedAt
    };
  }

  // Returns the current quantity for a product (and optionally variant, batch, location)
  private async getCurrentQuantity(dto: InventoryMovementDto): Promise<number> {
    const where: any = {
      tenantId: dto.tenantId,
      productId: dto.productId,
    };
    if (dto.variantId) where.productVariantId = dto.variantId;
    if (dto.batchNumber) where.batchNumber = dto.batchNumber;
    if (dto.destination?.type === 'store') {
      where.storeId = dto.destination.id;
    } else if (dto.destination?.type === 'warehouse') {
      where.warehouseId = dto.destination.id;
    }

    const result = await prisma.inventory.aggregate({
      _sum: { quantity: true },
      where,
    });

    return result._sum.quantity ?? 0;
  }

  async updateMovement(
    tenantId: string,
    id: string,
    updates: Partial<InventoryMovementDto>
  ): Promise<InventoryResponseDto | null> {
    const existingMovement = await prisma.inventory.findUnique({
      where: { id, tenantId },
      include: {
        product: {
          select: {
            isControlled: true
          }
        }
      }
    });

    if (!existingMovement) return null;

    // Validate controlled substances
    if (updates.metadata?.prescriptionId && existingMovement.product.isControlled) {
      if (!updates.metadata.pharmacistId) {
        throw new Error("Pharmacist ID required for controlled substances");
      }
      if (updates.quantity && updates.quantity <= 0) {
        throw new Error("Negative quantities not allowed for controlled substances");
      }
    }

    const updatedMovement = await prisma.inventory.update({
      where: { id, tenantId },
      data: {
        ...updates,
        metadata: {
          ...existingMovement.metadata,
          ...updates.metadata,
          temperature: updates.metadata?.temperatureLog?.avg || existingMovement.metadata?.temperature
        }
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
            isControlled: true
          }
        },
        store: true,
        warehouse: true
      }
    });

    // Invalidate cache
    await cacheService.invalidateInventory(tenantId, updatedMovement.productId);

    return this.toResponseDto(updatedMovement);
  }

  async deleteMovement(tenantId: string, id: string): Promise<boolean> {
    const existingMovement = await prisma.inventory.findUnique({
      where: { id, tenantId }
    });

    if (!existingMovement) return false;

    await prisma.inventory.delete({
      where: { id, tenantId }
    });

    // Invalidate cache
    await cacheService.invalidateInventory(tenantId, existingMovement.productId);

    // Emit event
    eventEmitter.emit("inventory:movement_deleted", {
      tenantId,
      productId: existingMovement.productId,
      variantId: existingMovement.productVariantId,
      quantity: existingMovement.quantity,
      movementType: existingMovement.movementType,
      batchNumber: existingMovement.batchNumber,
      expiryDate: existingMovement.expiryDate
    });

    return true;
  } 
}

export const inventoryService = new InventoryService();