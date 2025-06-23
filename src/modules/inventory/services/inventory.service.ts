import { PrismaClient } from "@prisma/client";
import {
  CreateInventoryMovementDto,
  UpdateInventoryMovementDto,
} from "../types/inventory.dto";

const prisma = new PrismaClient();

export class InventoryService {
  async createMovement(data: CreateInventoryMovementDto) {
    return prisma.inventory.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async getMovements(
    tenantId: string,
    filters: Partial<{ productId: string; storeId: string; warehouseId: string; movementType: string }> = {}
  ) {
    return prisma.inventory.findMany({
      where: {
        tenantId,
        ...filters,
      },
      orderBy: { createdAt: "desc" },
      include: { product: true, store: true, warehouse: true },
    });
  }

  async getMovementById(tenantId: string, id: string) {
    return prisma.inventory.findFirst({
      where: { id, tenantId },
      include: { product: true, store: true, warehouse: true },
    });
  }

  async updateMovement(tenantId: string, id: string, data: UpdateInventoryMovementDto) {
    return prisma.inventory.updateMany({
      where: { id, tenantId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async deleteMovement(tenantId: string, id: string) {
    return prisma.inventory.deleteMany({
      where: { id, tenantId },
    });
  }
}

export const inventoryService = new InventoryService();
