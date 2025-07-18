// src/modules/tenantCatalog/services/tenantProduct.service.ts
import prisma from '@shared/infra/database/prisma';
import { CreateTenantProductDto, UpdateTenantProductDto } from '../types/tenantCatalog.dto';


import { cacheService } from "@cache/cache.service";
import { CacheKeys } from "@cache/cacheKeys";
import { auditService } from "@modules/audit/services/audit.service";
import { eventBus } from "@events/eventBus";
import { EVENTS } from "@events/events";
import {logger} from "@logging/logger";


export class TenantProductService {
  async createProduct(
    actorId: string,
    dto: CreateTenantProductDto & { category?: { name: string; imageUrl?: string; parentId?: string; description?: string }; variants?: Array<{ name: string; sku: string; costPrice: number; sellingPrice: number; stock?: number; imageUrl?: string; variantAttributeIds: string[] }> }
  
  ) {
    // 1. Check if Tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id: dto.tenantId } });
    if (!tenant) throw new Error("Tenant not found.");

    // 2. Check Unique SKU per tenant
    const dup = await prisma.tenantProduct.findFirst({
      where: { sku: dto.sku, tenantId: dto.tenantId },
    });
    if (dup) throw new Error("SKU already exists.");

    
    

    // 3. Check category exists & belongs to tenant
    let categoryConnect: { id: string } | undefined;
    if (dto.tenantCategoryId) {
      const cat = await prisma.tenantCategory.findUnique({
        where: { id: dto.tenantCategoryId },
      });
      if (!cat || cat.tenantId !== dto.tenantId) {
        throw new Error("Invalid categoryId.");
      }
      categoryConnect = { id: cat.id };
    } else if (dto.category) {
  // inline create
  const newCat = await prisma.tenantCategory.create({
    data: { ...dto.category, tenantId: dto.tenantId }
  });
    categoryConnect = { id: newCat.id };
    }
    // 4. Create
    const product = await prisma.tenantProduct.create({ 
      data: {
        tenantId: dto.tenantId,
        tenantCategoryId: categoryConnect?.id,
        sku: dto.sku,
        name: dto.name,
        isTransferable: false,
        description: dto.description,
        barcode: dto.barcode,
        brand: dto.brand,
        imageUrl: dto.imageUrl,
        isActive: dto.isActive,
        createdAt: dto.createdAt,
      } 
    });

    // 5. Audit
    await auditService.log({
      tenantId: dto.tenantId,
      userId: actorId,
      module: "tenant_product",
      action: "create",
      entityId: product.id,
      details: dto,
    });

    // 6. Cache
    await cacheService.del(CacheKeys.tenantProductList(dto.tenantId));

    // 7. Event
    eventBus.emit(EVENTS.TENANT_PRODUCT_CREATED, {
      tenantId: dto.tenantId,
      id: product.id,
      name: product.name,
      userId: actorId,
      details: product
    });

    logger.info(`TenantProduct created: ${product.id}`);
    return product;
  }

  async updateProduct(
    id: string,
    userId: string,
    dto: UpdateTenantProductDto,
  ) {
    // 1. Check SKU conflict
    if (dto.sku) {
      const dup = await prisma.tenantProduct.findFirst({
        where: { sku: dto.sku, tenantId: dto.tenantId!, id: { not: id } },
      });
      if (dup) throw new Error("SKU conflict.");
    }

    // 2. Update
    const product = await prisma.tenantProduct.update({
      where: { id_tenantId: { id, tenantId: dto.tenantId! } },
      data: dto as any,
    });

    // 3. Audit
    await auditService.log({
      tenantId: product.tenantId,
      userId: userId,
      module: "tenant_product",
      action: "update",
      entityId: id,
      details: dto,
    });

    // 4. Cache
    await cacheService.del(CacheKeys.tenantProductList(product.tenantId));
    await cacheService.del(
      CacheKeys.tenantProductDetail(product.tenantId, id)
    );

    // 5. Event
    eventBus.emit(EVENTS.TENANT_PRODUCT_UPDATED, {
      tenantId: product.tenantId,
      tenantProductId: id,
      changes: dto,
      userId,
    });

    logger.info(`TenantProduct updated: ${id}`);
    return product;
  }

  async deleteProduct(id: string, tenantId: string, actorId: string) {
    // 1. Fetch
    const product = await prisma.tenantProduct.findUnique({ where: { id } });
    if (!product || product.tenantId !== tenantId) throw new Error("Not found.");

    // 2. Delete
    await prisma.tenantProduct.delete({ where: { id } });

    // 3. Audit
    await auditService.log({
      tenantId,
      userId: actorId,
      module: "tenant_product",
      action: "delete",
      entityId: id,
    });

    // 4. Cache
    await cacheService.del(CacheKeys.tenantProductList(tenantId));
    await cacheService.del(CacheKeys.tenantProductDetail(tenantId, id));

    // 5. Event
    eventBus.emit(EVENTS.TENANT_PRODUCT_DELETED, {
      tenantId,
      tenantProductId: id,
      userId: actorId,
    });

    logger.info(`TenantProduct deleted: ${id}`);
    return { success: true };
  }

  async getProducts(tenantId: string) {
    const key = CacheKeys.tenantProductList(tenantId);
    let list = await cacheService.get<any[]>(key);
    if (!list) {
      list = await prisma.tenantProduct.findMany({ where: { tenantId } });
      await cacheService.set(key, list, 300);
    }
    return list;
  }


  async getProductById(id: string) {
    const product = await prisma.tenantProduct.findUnique({ where: { id } });
    if (!product) throw new Error("Not found.");
    const key = CacheKeys.tenantProductDetail(product.tenantId, id);
    let p = await cacheService.get<any>(key);
    if (!p) {
      p = product;
      await cacheService.set(key, p, 300);
    }
    return p;
  }
}

export const tenantProductService = new TenantProductService();
