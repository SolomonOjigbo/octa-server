import prisma from '@shared/infra/database/prisma';
import { CreateGlobalProductDto, UpdateGlobalProductDto } from '../types/globalCatalog.dto';


import { cacheService } from "@cache/cache.service";
import { CacheKeys } from "@cache/cacheKeys";
import { auditService } from "@modules/audit/services/audit.service";
import { eventBus } from "@events/eventBus";
import { EVENTS } from "@events/events";
import {logger } from "@logging/logger";
import { globalVariantService } from './globalVariant.service';
import { createGlobalProductSchema } from '../validations';



export class GlobalProductService {
  async createGlobalProduct(
    actorId: string,
    tenantId: string,
    dto: CreateGlobalProductDto & { category?: { name: string; imageUrl?: string; parentId?: string; description?: string }; variants?: Array<{ name: string; sku: string; costPrice: number; sellingPrice: number; stock?: number; imageUrl?: string; variantAttributeIds: string[] }> }
  ) {
    // 1. Validate incoming DTO
    const data = createGlobalProductSchema.parse(dto);

    // 2. Resolve category (inline vs reference)
    let categoryId = data.globalCategoryId;
    if (!categoryId && dto.category) {
      // inline create
      const newCat = await prisma.globalCategory.create({
        data: { ...dto.category, createdAt: new Date(), updatedAt: new Date() },
      });
      categoryId = newCat.id;

      // audit & event for category
      await auditService.log({
        tenantId,
        userId: actorId,
        module: "global_category",
        action: "create",
        entityId: newCat.id,
        details: {
          name: newCat.name,
          description: newCat.description,
        },
      });
      eventBus.emit(EVENTS.GLOBAL_CATEGORY_CREATED, {
        tenantId,
        categoryId: newCat.id,
        userId: actorId,
      });
      await cacheService.del(CacheKeys.globalCategoryList());
      logger.info(`Inline GlobalCategory created: ${newCat.id}`);
    }

    if (!categoryId) {
      throw new Error("globalCategoryId is required (either reference or inline).");
    }

    // 3. Create the GlobalProduct
    const product = await prisma.globalProduct.create({
      data: {
        globalCategoryId: categoryId,
        sku: data.sku,
        name: data.name,
        barcode: data.barcode,
        imageUrl: data.imageUrl,
        brand: data.brand,
        dosageForm: data.dosageForm,
        sellingType: data.sellingType,
        description: data.description,
        isPrescription: data.isPrescription ?? false,
        isActive: data.isActive ?? true,
      },
    });

    // audit & event for product
    await auditService.log({
      tenantId,
      userId: actorId,
      module: "global_product",
      action: "create",
      entityId: product.id,
      details: { sku: product.sku, name: product.name },
    });
    eventBus.emit(EVENTS.GLOBAL_PRODUCT_CREATED, {
      tenantId,
      GlobalProductId: product.id,
      actorId,
    });
    await Promise.all([
      cacheService.del(CacheKeys.globalProductList(categoryId)),
      cacheService.del(CacheKeys.globalProductDetail(product.id))
    ]);
    logger.info(`GlobalProduct created: ${product.id}`);

    // 4. Create Variants (if any)
    if (Array.isArray(dto.variants)) {
      for (const v of dto.variants) {
        // attach the parent productId
        await globalVariantService.createGlobalProductVariant(
          tenantId,
          actorId,
          
          {  ...v,
            globalProductId: product.id,
        }
        );
      }
    }

    // 5. Return the newly created product
    return product;
  }

  async updateGlobalProduct(
    id: string,
    userId: string,
    tenantId: string,
    dto: UpdateGlobalProductDto,
  ) {
    // 1. Unique code check if changed
    if (dto.sku) {
      const conflict = await prisma.globalProduct.findFirst({
        where: { sku: dto.sku, id: { not: id } },
      });
      if (conflict) throw new Error("GlobalProduct sku conflict.");
    }

    // 2. Update
    const product = await prisma.globalProduct.update({
      where: { id },
      data: dto as any,
    });

    // 3. Audit
    await auditService.log({
      tenantId: tenantId,
      userId: userId,
      module: "global_product",
      action: "update",
      entityId: id,
      details: dto,
    });

    // 4. Cache
    await cacheService.del(CacheKeys.globalProductList(product.globalCategoryId));
    await cacheService.del(
      CacheKeys.globalProductDetail(id)
    );

    // 5. Event
    eventBus.emit(EVENTS.GLOBAL_PRODUCT_UPDATED, {
      tenantId: tenantId,
      globalProductId: id,
      changes: dto,
      userId,
    });

    logger.info(`GlobalProduct updated: ${id}`);
    return product;
  }

  async deleteGlobalProduct(id: string, userId: string, tenantId: string) {
    // 1. Fetch to get tenantId
    const product = await prisma.globalProduct.findUnique({ where: { id } });
    if (!product) throw new Error("GlobalProduct not found.");

    // 2. Delete
    await prisma.globalProduct.delete({ where: { id } });

    // 3. Audit
    await auditService.log({
      tenantId: tenantId,
      userId: userId,
      module: "global_product",
      action: "delete",
      entityId: id,
    });

    // 4. Cache
    await cacheService.del(CacheKeys.globalProductList(tenantId));
    await cacheService.del(
      CacheKeys.globalProductDetail( id)
    );

    // 5. Event
    eventBus.emit(EVENTS.GLOBAL_PRODUCT_DELETED, {
      tenantId: tenantId,
      globalProductId: id,
      userId,
    });

    logger.info(`GlobalProduct deleted: ${id}`);
    return { success: true };
  }

  async getGlobalProducts(tenantId: string) {
    const key = CacheKeys.globalProductList(tenantId);
    let list = await cacheService.get<any[]>(key);
    if (!list) {
      list = await prisma.globalProduct.findMany();
      await cacheService.set(key, list, 300);
    }
    return list;
  }

  async getGlobalProductById(id: string) {
    // Fetch first to get tenantId
    const product = await prisma.globalProduct.findUnique({ where: { id } });
    if (!product) throw new Error("GlobalProduct not found.");
    const key = CacheKeys.globalProductDetail(id);
    let p = await cacheService.get<any>(key);
    if (!p) {
      p = product;
      await cacheService.set(key, p, 300);
    }
    return p;
  }
}

export const globalProductService = new GlobalProductService();
