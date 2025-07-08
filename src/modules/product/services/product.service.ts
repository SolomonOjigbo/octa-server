import { PrismaClient } from "@prisma/client";
import { 
  CreateProductDto,
  UpdateProductDto,
  
  ProductResponseDto,
  ProductVariantResponseDto,
  ProductCategoryResponseDto,
  CreateVariantDto,
  UpdateVariantDto,
  ProductQueryFilters
} from "../types/product.dto";
import { PaginationOptionsDto, PaginatedResult } from "@common/types/pagination.dto";
import { auditService } from "@modules/audit/services/audit.service";
import { eventBus } from "@events/eventBus";
import { EVENTS } from "@events/events";
import { cacheService } from "@cache/cache.service";
// import { StockLocation } from "../../inventory/types/inventory.dto";

const prisma = new PrismaClient();





export class ProductService {

  // ========== Product CRUD ==========
  async createProduct(
    dto: CreateProductDto,
    createdBy?: string
  ) {
    // handle category inline vs. reference
let categoryConnect: { id: string } | undefined;
if (dto.categoryId) {
  // existing
  categoryConnect = { id: dto.categoryId };
} else if (dto.category) {
  // inline create
  const newCat = await prisma.productCategory.create({
    data: { ...dto.category, tenantId: dto.tenantId }
  });
  categoryConnect = { id: newCat.id };
  // audit & event
  await auditService.log({ 
    userId: createdBy,
    tenantId: dto.tenantId,
    action: "PRODUCT_CATEGORY_CREATED",
    module: "product",
    entityId: newCat.id,
    metadata: {
      name: newCat.name
    },
    details: {
      categoryId: newCat.id,
      categoryName: newCat.name
    }
   });
  eventBus.emit(EVENTS.PRODUCT_CATEGORY_CREATED, {
    tenantId: dto.tenantId,
    categoryId: newCat.id
  });
  cacheService.del(`categories:list:${dto.tenantId}`);
}

// then create product
const product = await prisma.product.create({
  data: {
    ...dto,
    category: categoryConnect ? { connect: categoryConnect } : undefined,
    variants: dto.variants
      ? { create: dto.variants.map(v => ({ 
        ...v,
         id: v.id,
        attributes: v.attributes,
        priceDelta: v.priceDelta,
        barcode: v.barcode,
        batchNumber: v.batchNumber,
        expiryDate: v.expiryDate,
       })) }
      : undefined,
  }
});

await auditService.log({
      tenantId: dto.tenantId,
      userId: createdBy,
      module: "product",
      action: "create",
      entityId: product.id,
      details: dto,
    });

     eventBus.emit(EVENTS.PRODUCT_CREATED, {
    tenantId: dto.tenantId,
    productId: product.id,
    createdBy: createdBy,
  });

  }

  async getProducts(tenantId: string, filters: ProductQueryFilters) {
    const cacheKey = `products:${tenantId}:${JSON.stringify(filters)}`;
    let products = await cacheService.get(cacheKey);
    if (!products) {
      products = await prisma.product.findMany({
        where: {
          tenantId,
          deletedAt: null, // Exclude soft-deleted
          categoryId: filters.categoryId,
          brand: filters.brand,
          isActive: filters.isActive,
          sellingPrice: {
            gte: filters.minPrice,
            lte: filters.maxPrice,
          },
          OR: filters.search ? [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { sku: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ] : undefined,
        },
        include: { category: true, variants: true }
      });
      await cacheService.set(cacheKey, products, 300);
    }
    return products;
  }


  async deleteProduct(id: string, userId: string, tenantId: string) {
    const product = await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await auditService.log({
      tenantId,
      userId,
      module: "Product",
      action: "delete",
      entityId: id,
    });
    eventBus.emit(EVENTS.PRODUCT_DELETED, { tenantId, productId: id });
    await cacheService.del(`products:${tenantId}`);
    return product;
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

  // ========== Product Variant CRUD ==========
  async createVariant(
    data: CreateVariantDto,
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
    data: UpdateVariantDto,
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