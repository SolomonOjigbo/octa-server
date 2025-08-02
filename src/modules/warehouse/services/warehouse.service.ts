import prisma from '@shared/infra/database/prisma';
import { cacheService } from '@cache/cache.service';
import { eventBus } from '@events/eventBus';
import { EVENTS } from '@events/events';
import { 
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseResponseDto,
  WarehouseWithRelationsDto
} from '../types/warehouse.dto';
import { AppError } from '@common/constants/app.errors';
import { WarehouseStatus } from '@prisma/client';

export class WarehouseService {
  private readonly DEFAULT_CACHE_TTL = 300; // 5 minutes
  private readonly INVENTORY_ITEMS_LIMIT = 20;

  private cacheKey(tenantId: string): string {
    return `warehouses:${tenantId}`;
  }

  private emitWarehouseEvent(
    eventType: keyof typeof EVENTS, 
    payload: WarehouseResponseDto | { id: string; tenantId: string }
  ): void {
    eventBus.emit(EVENTS[eventType], payload);
  }

  private async validateBusinessEntity(
    tenantId: string,
    businessEntityId: string,
    prismaClient: any = prisma
  ): Promise<void> {
    const exists = await prismaClient.businessEntity.findUnique({
      where: { 
        id: businessEntityId,
        tenantId 
      },
      select: { id: true }
    });

    if (!exists) {
      throw new AppError('Business entity not found or does not belong to tenant', 404);
    }
  }

  async create(
    tenantId: string,
    userId: string,
    dto: CreateWarehouseDto
  ): Promise<WarehouseResponseDto> {
    return prisma.$transaction(async (tx) => {
      await this.validateBusinessEntity(tenantId, dto.businessEntityId, tx);

      const warehouse = await tx.warehouse.create({
        data: {
          name: dto.name,
          code: dto.code,
          address: dto.address,
          status: dto.status || WarehouseStatus.INACTIVE, // Default status
          tenant: { connect: { id: tenantId } },
          businessEntity: { connect: { id: dto.businessEntityId } },
        },
      });

      await cacheService.del(this.cacheKey(tenantId));
      this.emitWarehouseEvent('WAREHOUSE_CREATED', warehouse);

      return warehouse;
    });
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateWarehouseDto
  ): Promise<WarehouseResponseDto> {
    await this.getById(tenantId, id); // Verify warehouse exists
    
    if (dto.businessEntityId) {
      await this.validateBusinessEntity(tenantId, dto.businessEntityId);
    }

    // Destructure dto to exclude businessEntityId
    const { businessEntityId, ...restDto } = dto;

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: {
        ...restDto,
        ...(businessEntityId && {
          businessEntity: { connect: { id: businessEntityId } }
        }),
      },
    });

    await cacheService.del(this.cacheKey(tenantId));
    this.emitWarehouseEvent('WAREHOUSE_UPDATED', warehouse);

    return warehouse;
  }

  async getById(
    tenantId: string,
    id: string
  ): Promise<WarehouseWithRelationsDto> {
    const cacheKey = `${this.cacheKey(tenantId)}:${id}`;
    const cached = await cacheService.get<WarehouseWithRelationsDto>(cacheKey);
    if (cached) return cached;

    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        businessEntity: {
          select: { id: true, name: true }
        },
        inventories: {
          select: {
            id: true,
            tenantProduct: {
              select: { name: true }
            },
            quantity: true
          },
          take: this.INVENTORY_ITEMS_LIMIT
        }
      }
    });

    if (!warehouse || warehouse.tenantId !== tenantId) {
      throw new AppError('Warehouse not found', 404);
    }

    // Map inventories to match WarehouseWithRelationsDto
    const mappedWarehouse: WarehouseWithRelationsDto = {
      ...warehouse,
      inventories: warehouse.inventories.map(inv => ({
        id: inv.id,
        productName: inv.tenantProduct.name,
        quantity: inv.quantity,
      })),
    };

    await cacheService.set(cacheKey, mappedWarehouse, this.DEFAULT_CACHE_TTL);
    return mappedWarehouse;
  }

  async list(
    tenantId: string,
    filters?: { status?: WarehouseStatus; businessEntityId?: string }
  ): Promise<WarehouseResponseDto[]> {
    const cacheKey = `${this.cacheKey(tenantId)}:${JSON.stringify(filters)}`;
    const cached = await cacheService.get<WarehouseResponseDto[]>(cacheKey);
    if (cached) return cached;

    const whereClause = {
      tenantId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.businessEntityId && { 
        businessEntityId: filters.businessEntityId 
      }),
    };

    const warehouses = await prisma.warehouse.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });

    await cacheService.set(cacheKey, warehouses, this.DEFAULT_CACHE_TTL);
    return warehouses;
  }

  async delete(tenantId: string, userId: string, id: string): Promise<void> {
    await this.getById(tenantId, id); // Verify exists
    
    await prisma.warehouse.delete({ 
      where: { id } 
    });

    await cacheService.del(this.cacheKey(tenantId));
    this.emitWarehouseEvent('WAREHOUSE_DELETED', { id, tenantId });
  }
}

export const warehouseService = new WarehouseService();