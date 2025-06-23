import { PrismaClient } from "@prisma/client";
import {
  CreateProductDto,
  UpdateProductDto,
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
  CreateProductVariantDto,
  UpdateProductVariantDto,
} from "../types/product.dto";

const prisma = new PrismaClient();

export class ProductService {
  // -------- Product Category CRUD --------
  async createCategory(data: CreateProductCategoryDto) {
    return prisma.productCategory.create({ data });
  }
  async getCategories(tenantId: string) {
    return prisma.productCategory.findMany({ where: { tenantId } });
  }
  async updateCategory(tenantId: string, id: string, data: UpdateProductCategoryDto) {
    return prisma.productCategory.updateMany({ where: { id, tenantId }, data });
  }
  async deleteCategory(tenantId: string, id: string) {
    return prisma.productCategory.deleteMany({ where: { id, tenantId } });
  }

  // -------- Product CRUD --------
  async createProduct(data: CreateProductDto) {
    // Optionally, create variants together
    const { variants, ...mainData } = data;
    return prisma.product.create({
      data: {
        ...mainData,
        variants: variants && variants.length
          ? { create: variants }
          : undefined,
      },
      include: { variants: true, category: true },
    });
  }

  async getProducts(tenantId: string, filters: any = {}) {
    return prisma.product.findMany({
      where: { tenantId, ...filters },
      include: { variants: true, category: true },
    });
  }

  async getProductById(tenantId: string, id: string) {
    return prisma.product.findFirst({
      where: { id, tenantId },
      include: { variants: true, category: true },
    });
  }

  async updateProduct(tenantId: string, id: string, data: UpdateProductDto) {
    return prisma.product.updateMany({
      where: { id, tenantId },
      data,
    });
  }

  async deleteProduct(tenantId: string, id: string) {
    return prisma.product.deleteMany({ where: { id, tenantId } });
  }

  // -------- Product Variant CRUD --------
  async createVariant(data: CreateProductVariantDto) {
    return prisma.productVariant.create({ data });
  }
  async getVariants(tenantId: string, productId?: string) {
    return prisma.productVariant.findMany({
      where: { tenantId, ...(productId && { productId }) },
    });
  }
  async updateVariant(tenantId: string, id: string, data: UpdateProductVariantDto) {
    return prisma.productVariant.updateMany({ where: { id, tenantId }, data });
  }
  async deleteVariant(tenantId: string, id: string) {
    return prisma.productVariant.deleteMany({ where: { id, tenantId } });
  }
}

export const productService = new ProductService();





// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

// type Product = Awaited<ReturnType<typeof prisma.product.create>>;

// export class ProductService {
//   async createProduct(data: Partial<Product>): Promise<Product> {
//     return prisma.product.create({ data });
//   }

//   async getProductById(id: string): Promise<Product | null> {
//     return prisma.product.findUnique({ where: { id } });
//   }

//   async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
//     return prisma.product.update({ where: { id }, data });
//   }

//   async deleteProduct(id: string): Promise<Product> {
//     return prisma.product.delete({ where: { id } });
//   }

//   async listProductsByTenant(tenantId: string): Promise<Product[]> {
//     return prisma.product.findMany({ where: { tenantId } });
//   }

//   async listProductsByStore(storeId: string): Promise<Product[]> {
//     // Join with inventory for products available in a store
//     const inventory = await prisma.inventory.findMany({
//       where: { storeId },
//       include: { product: true }
//     });
//     return inventory.map(inv => inv.product);
//   }
// }
