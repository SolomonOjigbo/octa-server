import { PrismaClient } from "@prisma/client";
import { 
  CreateStoreDto, 
  UpdateStoreDto,
  StoreResponseDto,
  StoreWithRelationsDto
} from "../types/store.dto";

const prisma = new PrismaClient();

export class StoreService {
  async createStore(
    dto: CreateStoreDto,
    createdBy?: string
  ): Promise<StoreResponseDto> {
    return prisma.$transaction(async (tx) => {
      // Ensure only one main store per tenant
      if (dto.isMain) {
        await tx.store.updateMany({
          where: { tenantId: dto.tenantId, isMain: true },
          data: { isMain: false }
        });
      }

      const store = await tx.store.create({
        data: {
          tenantId: dto.tenantId,
          businessEntityId: dto.businessEntityId,
          name: dto.name,
          code: dto.code,
          address: dto.address,
          phone: dto.phone,
          email: dto.email,
          type: dto.type || 'retail',
          status: dto.status || 'active',
          isMain: dto.isMain || false,
          managerId: dto.managerId,
          openingHours: dto.openingHours,
          branding: dto.branding,
          settings: dto.settings,
          metadata: {
            createdBy
          }
        },
        select: this.defaultSelectFields()
      });

      return store;
    });
  }

  async getStores(
    tenantId: string,
    options?: {
      includeManager?: boolean;
      includeInventoryCount?: boolean;
    }
  ): Promise<StoreWithRelationsDto[]> {
    return prisma.store.findMany({
      where: { tenantId },
      select: {
        ...this.defaultSelectFields(),
        ...(options?.includeManager && {
          manager: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }),
        ...(options?.includeInventoryCount && {
          _count: {
            select: { inventories: true }
          }
        })
      }
    }).then(stores => stores.map(store => ({
      ...store,
      ...('_count' in store && { inventoryCount: store._count?.inventories })
    })));
  }

  async getStoreById(
    id: string,
    tenantId: string,
    options?: {
      includeManager?: boolean;
      includeBusinessEntity?: boolean;
    }
  ): Promise<StoreWithRelationsDto | null> {
    return prisma.store.findUnique({
      where: { id, tenantId },
      select: {
        ...this.defaultSelectFields(),
        ...(options?.includeManager && {
          manager: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }),
        ...(options?.includeBusinessEntity && {
          businessEntity: {
            select: {
              id: true,
              name: true
            }
          }
        })
      }
    });
  }

  async updateStore(
    dto: UpdateStoreDto,
    tenantId: string,
    updatedBy?: string
  ): Promise<StoreResponseDto> {
    return prisma.$transaction(async (tx) => {
      // Handle main store update
      if (dto.isMain) {
        await tx.store.updateMany({
          where: { tenantId, isMain: true, NOT: { id: dto.id } },
          data: { isMain: false }
        });
      }

      return tx.store.update({
        where: { id: dto.id, tenantId },
        data: {
          businessEntityId: dto.businessEntityId,
          name: dto.name,
          code: dto.code,
          address: dto.address,
          phone: dto.phone,
          email: dto.email,
          type: dto.type,
          status: dto.status,
          isMain: dto.isMain,
          managerId: dto.managerId,
          openingHours: dto.openingHours,
          branding: dto.branding,
          settings: dto.settings,
          metadata: {
            updatedBy
          }
        },
        select: this.defaultSelectFields()
      });
    });
  }

  async deleteStore(
    id: string,
    tenantId: string,
    deletedBy?: string
  ): Promise<void> {
    await prisma.store.deleteMany({ 
      where: { id, tenantId } 
    });
  }

  private defaultSelectFields() {
    return {
      id: true,
      tenantId: true,
      businessEntityId: true,
      name: true,
      code: true,
      address: true,
      phone: true,
      email: true,
      type: true,
      status: true,
      isMain: true,
      managerId: true,
      openingHours: true,
      createdAt: true,
      updatedAt: true
    };
  }
}

export const storeService = new StoreService();