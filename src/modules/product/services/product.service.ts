import { PrismaClient } from "@prisma/client";
import { 
  CreateProductDto,
  UpdateProductDto,
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
  CreateProductVariantDto,
  UpdateProductVariantDto,
  ProductResponseDto,
  ProductVariantResponseDto,
  ProductCategoryResponseDto
} from "../types/product.dto";
import { PaginationOptionsDto, PaginatedResult } from "@common/types/pagination.dto";
// import { StockLocation } from "../../inventory/types/inventory.dto";

const prisma = new PrismaClient();





export class ProductService {

  // ========== Product CRUD ==========
  async createProduct(
    data: CreateProductDto,
    createdBy?: string
  ): Promise<ProductResponseDto> {
    return prisma.$transaction(async (tx) => {
      const { variants, ...productData } = data;
      
      const product = await tx.product.create({
        data: {
          ...productData,
          metadata: {
            createdBy
          },
          variants: variants?.length ? {
            create: variants.map(v => ({
              ...v,
              metadata: {
                createdBy
              }
            }))
          } : undefined
        },
        include: {
          category: true,
          variants: true
        }
      });

      return this.mapProductToDto(product);
    });
  }

  async getProducts(
    tenantId: string,
    filters: {
      search?: string;
      categoryId?: string;
      sku?: string;
      barcode?: string;
      isActive?: boolean;
      minPrice?: number;
      maxPrice?: number;
      locationType?: 'store' | 'warehouse';
      locationId?: string;
    } & PaginationOptionsDto
  ): Promise<PaginatedResult<ProductResponseDto>> {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      categoryId,
      sku,
      barcode,
      isActive,
      minPrice,
      maxPrice,
      locationType,
      locationId
    } = filters;

    const where = {
      tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(categoryId && { categoryId }),
      ...(sku && { sku }),
      ...(barcode && { barcode }),
      ...(isActive !== undefined && { isActive }),
      ...((minPrice || maxPrice) && {
        sellingPrice: {
          ...(minPrice && { gte: minPrice }),
          ...(maxPrice && { lte: maxPrice })
        }
      })
    };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          variants: true,
          ...(locationType && locationId && {
            stocks: {
              where: {
                [locationType === 'store' ? 'storeId' : 'warehouseId']: locationId
              }
            }
          })
        },
        orderBy: { name: 'asc' }
      })
    ]);

    return {
      data: products.map(this.mapProductToDto),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getProductById(
    tenantId: string,
    id: string,
    options?: {
      withStock?: boolean;
      withSuppliers?: boolean;
      withInventory?: boolean;
    }
  ): Promise<ProductResponseDto | null> {
    const product = await prisma.product.findUnique({
      where: { id, tenantId },
      include: {
        category: true,
        variants: true,
        ...(options?.withStock && { stocks: true }),
        ...(options?.withSuppliers && {
          suppliers: {
            include: {
              supplier: true
            }
          }
        }),
        ...(options?.withInventory && {
          inventories: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        })
      }
    });

    return product ? this.mapProductToDto(product) : null;
  }

  async updateProduct(
    tenantId: string,
    id: string,
    data: UpdateProductDto,
    updatedBy?: string
  ): Promise<ProductResponseDto> {
    return prisma.product.update({
      where: { id, tenantId },
      data: {
        ...data,
        metadata: {
          updatedBy
        }
      },
      include: {
        category: true,
        variants: true
      }
    }).then(this.mapProductToDto);
  }

  async deleteProduct(tenantId: string, id: string): Promise<void> {
    await prisma.product.delete({ where: { id, tenantId } });
  }

  // ========== Product Variant CRUD ==========
  async createVariant(
    data: CreateProductVariantDto,
    createdBy?: string
  ): Promise<ProductVariantResponseDto> {
    return prisma.productVariant.create({
      data: {
        ...data,
        metadata: {
          createdBy
        }
      }
    });
  }

  async getVariants(
    tenantId: string,
    productId?: string
  ): Promise<ProductVariantResponseDto[]> {
    return prisma.productVariant.findMany({
      where: { tenantId, ...(productId && { productId }) },
      include: {
        product: {
          select: {
            name: true,
            sku: true
          }
        }
      }
    });
  }

  async updateVariant(
    tenantId: string,
    id: string,
    data: UpdateProductVariantDto,
    updatedBy?: string
  ): Promise<ProductVariantResponseDto> {
    return prisma.productVariant.update({
      where: { id, tenantId },
      data: {
        ...data,
        metadata: {
          updatedBy
        }
      }
    });
  }

  async deleteVariant(tenantId: string, id: string): Promise<void> {
    await prisma.productVariant.delete({ where: { id, tenantId } });
  }

  // ========== Batch Operations ==========
  async importProducts(
    tenantId: string,
    products: CreateProductDto[],
    createdBy?: string
  ): Promise<{ success: ProductResponseDto[]; errors: Array<{ product: CreateProductDto; error: string }> }> {
    const results = await prisma.$transaction(
      products.map(product => 
        prisma.product.create({
          data: {
            ...product,
            tenantId,
            metadata: {
              createdBy
            },
            variants: product.variants?.length ? {
              create: product.variants.map(v => ({
                ...v,
                metadata: {
                  createdBy
                }
              }))
            } : undefined
          },
          include: {
            category: true,
            variants: true
          }
        })
        .then(p => ({ success: this.mapProductToDto(p) }))
        .catch(e => ({ error: e.message, product }))
      )
    );

    return {
      success: results.filter(r => 'success' in r).map(r => r.success),
      errors: results.filter(r => 'error' in r) as any
    };
  }

  async exportProducts(
    tenantId: string,
    options: {
      format?: 'csv' | 'json';
      includeStock?: boolean;
      includeVariants?: boolean;
    }
  ): Promise<{ headers: string[]; rows: any[] } | ProductResponseDto[]> {
    const products = await prisma.product.findMany({
      where: { tenantId },
      include: {
        category: true,
        variants: options.includeVariants,
        ...(options.includeStock && { stocks: true })
      }
    });

    if (options.format === 'csv') {
      const headers = [
        'ID', 'Name', 'SKU', 'Barcode', 'Category', 
        'Cost Price', 'Selling Price', 'Stock Quantity'
      ];
      
      const rows = products.map(p => [
        p.id,
        p.name,
        p.sku,
        p.barcode || '',
        p.category?.name || '',
        p.costPrice,
        p.sellingPrice,
        options.includeStock 
          ? p.stocks?.reduce((sum, s) => sum + s.quantity, 0) || 0
          : ''
      ]);

      return { headers, rows };
    }

    return products.map(this.mapProductToDto);
  }

  // ========== Helper Methods ==========
  private categorySelectFields() {
    return {
      id: true,
      tenantId: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true
    };
  }

  private mapProductToDto(product: any): ProductResponseDto {
    return {
      id: product.id,
      tenantId: product.tenantId,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      description: product.description,
      brand: product.brand,
      costPrice: product.costPrice,
      storeId: product.storeId,
      sellingPrice: product.sellingPrice,
      isActive: product.isActive,
      dosageForm: product.dosageForm,
      strength: product.strength,
      category: product.category ? {
        id: product.category.id,
        name: product.category.name
      } : undefined,
      variants: product.variants?.map(v => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        barcode: v.barcode,
        costPrice: v.costPrice,
        sellingPrice: v.sellingPrice,
        isActive: v.isActive
      })),
      stocks: product.stocks?.map(s => ({
        id: s.id,
        quantity: s.quantity,
        store: s.storeId ? { id: s.storeId } : undefined,
        warehouse: s.warehouseId ? { id: s.warehouseId } : undefined
      })),
      suppliers: product.suppliers?.map(s => ({
        id: s.id,
        supplier: {
          id: s.supplier.id,
          name: s.supplier.name,
          email: s.supplier.email,
          phone: s.supplier.phone
        },
        createdAt: s.createdAt
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  }
}

export const productService = new ProductService();