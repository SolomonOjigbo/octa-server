import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient(); 

type ProductSupplier = Awaited<ReturnType<typeof prisma.productSupplier.create>>;

export class ProductSupplierService {
  async linkProductSupplier(data: Partial<ProductSupplier>): Promise<ProductSupplier> {
    return prisma.productSupplier.create({ data });
  }

  async unlinkProductSupplier(id: string): Promise<ProductSupplier> {
    return prisma.productSupplier.delete({ where: { id } });
  }

  async listSuppliersForProduct(productId: string): Promise<ProductSupplier[]> {
    return prisma.productSupplier.findMany({ where: { productId } });
  }

  async listProductsForSupplier(supplierId: string): Promise<ProductSupplier[]> {
    return prisma.productSupplier.findMany({ where: { supplierId } });
  }
}
