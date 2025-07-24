// src/modules/store/services/store.service.ts

import prisma from "@shared/infra/database/prisma";
import { CreateStoreDto, UpdateStoreDto } from "../types/store.dto";



export class StoreService {
  async createStore(dto: any) {
    // Ensure tenant and business entity exist and are related
    const tenant = await prisma.tenant.findUnique({ where: { id: dto.tenantId } });
    if (!tenant) throw new Error("Invalid tenantId: Tenant not found.");
  
    const businessEntity = await prisma.businessEntity.findUnique({ where: { id: dto.businessEntityId } });
    if (!businessEntity || businessEntity.tenantId !== dto.tenantId) {
      throw new Error("Invalid businessEntityId for this tenant.");
    }
  
    // Ensure store code uniqueness within tenant
    const existing = await prisma.store.findFirst({
      where: { code: dto.code, tenantId: dto.tenantId },
    });
    if (existing) throw new Error("Store code already exists for this tenant.");
  
    // (Optional) If managerId is provided, validate it
    if (dto.managerId) {
      const manager = await prisma.user.findUnique({ where: { id: dto.managerId } });
      if (!manager || manager.tenantId !== dto.tenantId) {
        throw new Error("Invalid managerId for this tenant.");
      }
    }
  
    return prisma.store.create({
      data: {
        ...dto,
        businessEntity: { connect: { id: dto.businessEntityId } },
        tenant: { connect: { id: dto.tenantId } }
      }
    });
  }

  async updateStore(id: string, dto: UpdateStoreDto) {
    return prisma.store.update({
      where: { id },
      data: dto,
    });
  }

  async getStores(tenantId: string) {
    return prisma.store.findMany({ where: { tenantId } });
  }

  async getStoreById(id: string) {
    return prisma.store.findUnique({ where: { id } });
  }

  async deleteStore(id: string) {
    return prisma.store.delete({ where: { id } });
  }
}

export const storeService = new StoreService();
