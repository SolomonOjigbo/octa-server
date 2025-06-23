import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type ProductCategory = Awaited<ReturnType<typeof prisma.productCategory.create>>;

export class CategoryService {
  async createCategory(data: Partial<ProductCategory>): Promise<ProductCategory> {
    return prisma.productCategory.create({ data });
  }

  async getCategoryById(id: string): Promise<ProductCategory | null> {
    return prisma.productCategory.findUnique({ where: { id } });
  }

  async updateCategory(id: string, data: Partial<ProductCategory>): Promise<ProductCategory> {
    return prisma.productCategory.update({ where: { id }, data });
  }

  async deleteCategory(id: string): Promise<ProductCategory> {
    return prisma.productCategory.delete({ where: { id } });
  }

  async listCategoriesByTenant(tenantId: string): Promise<ProductCategory[]> {
    return prisma.productCategory.findMany({ where: { tenantId } });
  }
}
