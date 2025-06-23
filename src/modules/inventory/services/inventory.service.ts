import { PrismaClient } from "@prisma/client";
import { InventoryMovementDto } from "../types/inventory.dto";
const prisma = new PrismaClient();


type Inventory = Awaited<ReturnType<typeof prisma.inventory.create>>;

export class InventoryService {
  async createInventory(data: Partial<Inventory>): Promise<Inventory> {
    return prisma.inventory.create({ data });
  }

   async createInventoryMovement(dto: InventoryMovementDto) {
    // Logs every in/out movement as a record in the Inventory table (history).
    return prisma.inventory.create({
      data: {
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async getInventoryById(id: string): Promise<Inventory | null> {
    return prisma.inventory.findUnique({ where: { id } });
  }

  async updateInventory(id: string, data: Partial<Inventory>): Promise<Inventory> {
    return prisma.inventory.update({ where: { id }, data });
  }

  async deleteInventory(id: string): Promise<Inventory> {
    return prisma.inventory.delete({ where: { id } });
  }

  async listInventoryByStore(storeId: string): Promise<Inventory[]> {
    return prisma.inventory.findMany({ where: { storeId } });
  }

  async listInventoryByProduct(productId: string): Promise<Inventory[]> {
    return prisma.inventory.findMany({ where: { productId } });
  }
}

export const inventoryService = new InventoryService();
