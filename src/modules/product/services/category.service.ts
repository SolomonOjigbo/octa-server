import { PrismaClient } from "@prisma/client";
import { CreateCategoryDto, ProductCategoryResponseDto, UpdateCategoryDto } from "../types/product.dto";
import { PaginatedResult, PaginationOptionsDto } from "@common/types/pagination.dto";
const prisma = new PrismaClient();

type ProductCategory = Awaited<ReturnType<typeof prisma.productCategory.create>>;

export class CategoryService {

   // ========== Product Category CRUD ==========
    async createCategory(
      data: CreateCategoryDto,
      createdBy?: string
    ): Promise<ProductCategoryResponseDto> {
      return prisma.productCategory.create({
        data: {
          ...data,
          metadata: {
            createdBy
          }
        },
        select: this.categorySelectFields()
      });
    }
  
    async getCategories(
      tenantId: string,
      options: PaginationOptionsDto & {
        search?: string;
        withProducts?: boolean;
      }
    ): Promise<PaginatedResult<ProductCategoryResponseDto>> {
      const { page = 1, limit = 10, search, withProducts } = options;
      const where = {
        tenantId,
        ...(search && {
          name: { contains: search, mode: 'insensitive' }
        })
      };
  
      const [total, categories] = await Promise.all([
        prisma.productCategory.count({ where }),
        prisma.productCategory.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          select: {
            ...this.categorySelectFields(),
            ...(withProducts && {
              _count: { select: { products: true } }
            })
          },
          orderBy: { name: 'asc' }
        })
      ]);
  
      return {
        data: categories.map(c => ({
          ...c,
          ...('_count' in c && { productCount: c._count?.products })
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    }
  
    async updateCategory(
      tenantId: string,
      id: string,
      data: UpdateCategoryDto,
      updatedBy?: string
    ): Promise<ProductCategoryResponseDto> {
      return prisma.productCategory.update({
        where: { id, tenantId },
        data: {
          ...data,
          metadata: {
            updatedBy
          }
        },
        select: this.categorySelectFields()
      });
    }
  
    async deleteCategory(tenantId: string, id: string): Promise<void> {
      await prisma.productCategory.delete({ where: { id, tenantId } });
    }


  async getCategoryById(tenantId: string, id: string): Promise<ProductCategory | null> {
    return prisma.productCategory.findUnique({ where: { id } });
  }
  private categorySelectFields() {
    return {
      id: true,
      name: true,
      description: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
      tenantId: true
    };
  }

  async getCategoryByName(tenantId: string, name: string): Promise<ProductCategory | null> {
    return prisma.productCategory.findFirst({
      where: { tenantId, name },
      select: this.categorySelectFields()
    });
  }

  async getCategoryBySlug(tenantId: string, slug: string): Promise<ProductCategory | null> {
    return prisma.productCategory.findFirst({
      where: { tenantId, slug },
      select: this.categorySelectFields()
    });
  }

  async getCategoriesByStore(tenantId: string, storeId: string, p0?: { page: number; limit: number; search: string; }): Promise<ProductCategory[]> {
    // const { page = 1, limit = 10, search = "" } = p0;
    return prisma.productCategory.findMany({
      where: { storeId },
      select: this.categorySelectFields()
    });
  }

  async listCategoriesByTenant(tenantId: string): Promise<ProductCategory[]> {
    return prisma.productCategory.findMany({ where: { tenantId } });
  }
}

export const categoryService = new CategoryService();