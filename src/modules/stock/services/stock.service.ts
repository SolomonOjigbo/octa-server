import { PrismaClient } from "@prisma/client";
import { AdjustStockDto, IncrementStockDto } from "../types/stock.dto";

const prisma = new PrismaClient();

export class StockService {
  // Get all stock for a tenant, filter by store/warehouse if needed
  async getStockLevels(tenantId: string, filters: Partial<{ storeId: string; warehouseId: string; productId: string }> = {}) {
    return prisma.stock.findMany({
      where: {
        tenantId,
        ...filters,
      },
      include: {
        product: true,
        store: true,
        warehouse: true,
      },
    });
  }

  // Get current stock for a product at a specific location
  async getStock(tenantId: string, productId: string, storeId?: string, warehouseId?: string) {
    return prisma.stock.findFirst({
      where: {
        tenantId,
        productId,
        storeId,
        warehouseId,
      },
    });
  }

  // Set stock level (absolute adjustment)
  async adjustStockLevel(dto: AdjustStockDto) {
    return prisma.stock.upsert({
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
        ...dto,
        updatedAt: new Date(),
      },
    });
  }

  // Increment/decrement stock level (atomic change)
  async incrementStockLevel(dto: IncrementStockDto) {
    const existing = await this.getStock(dto.tenantId, dto.productId, dto.storeId, dto.warehouseId);
    if (existing) {
      return prisma.stock.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + dto.delta,
          updatedAt: new Date(),
        },
      });
    } else {
      // If no record, create it with the delta if positive, or 0 if negative
      return prisma.stock.create({
        data: {
          tenantId: dto.tenantId,
          productId: dto.productId,
          storeId: dto.storeId,
          warehouseId: dto.warehouseId,
          quantity: dto.delta > 0 ? dto.delta : 0,
          updatedAt: new Date(),
        },
      });
    }
  }

  // Delete stock record (rarely needed; use with caution)
  async deleteStock(tenantId: string, productId: string, storeId?: string, warehouseId?: string) {
    return prisma.stock.deleteMany({
      where: {
        tenantId,
        productId,
        storeId,
        warehouseId,
      },
    });
  }
}

export const stockService = new StockService();
