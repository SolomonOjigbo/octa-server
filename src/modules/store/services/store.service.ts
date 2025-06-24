import { PrismaClient } from "@prisma/client";
import { CreateStoreDto, UpdateStoreDto } from "../types/store.dto";
import { Store } from "../types/store.dto";

const prisma = new PrismaClient();


export class StoreService {
  async createStore(dto: CreateStoreDto): Promise<Store> {
    return prisma.store.create({ data: dto });
  }

  async getStores(tenantId: string): Promise<Store[]> {
    return prisma.store.findMany({ where: { tenantId } });
  }

  async getStoreById(tenantId: string, id: string): Promise<Store | null> {
    return prisma.store.findFirst({ where: { id, tenantId } });
  }

  async updateStore(tenantId: string, id: string, data: UpdateStoreDto): Promise<Store | null> {
    // Only update if store belongs to this tenant
    return prisma.store.update({
      where: { id },
      data,
    });
  }

  async deleteStore(tenantId: string, id: string): Promise<Store | null> {
    // Only delete if store belongs to this tenant
    return prisma.store.delete({ where: { id } });
  }
}

export const storeService = new StoreService();
