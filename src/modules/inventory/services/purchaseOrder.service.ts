import { PrismaClient} from "@prisma/client";
const prisma = new PrismaClient();

type PurchaseOrder = Awaited<ReturnType<typeof prisma.purchaseOrder.create>>;

export class PurchaseOrderService {
  async createPurchaseOrder(data: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    return prisma.purchaseOrder.create({ data });
  }

  async getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
    return prisma.purchaseOrder.findUnique({ where: { id } });
  }

  async updatePurchaseOrder(id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    return prisma.purchaseOrder.update({ where: { id }, data });
  }

  async deletePurchaseOrder(id: string): Promise<PurchaseOrder> {
    return prisma.purchaseOrder.delete({ where: { id } });
  }

  async listPurchaseOrdersByTenant(tenantId: string): Promise<PurchaseOrder[]> {
    return prisma.purchaseOrder.findMany({ where: { tenantId } });
  }

  async listPurchaseOrdersBySupplier(supplierId: string): Promise<PurchaseOrder[]> {
    return prisma.purchaseOrder.findMany({ where: { supplierId } });
  }
}
