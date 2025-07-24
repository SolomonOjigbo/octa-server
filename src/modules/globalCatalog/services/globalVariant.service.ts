
import prisma from '@shared/infra/database/prisma';
import { CreateGlobalProductVariantDto, UpdateGlobalProductVariantDto } from '../types/globalCatalog.dto';

import prisma from "@shared/infra/database/prisma";
import { cacheService } from "@cache/cache.service";
import { CacheKeys } from "@cache/cacheKeys";
import { auditService } from "@modules/audit/services/audit.service";
import { eventBus } from "@events/eventBus";
import { EVENTS } from "@events/events";
import {logger } from "@logging/logger";



export class GlobalVariantService {
  async createGlobalProductVariant(
    tenantId: string,
    userId: string,
    dto: CreateGlobalProductVariantDto,
  ) {
    const product = await prisma.globalProduct.findUnique({
    where: { globalProductId: dto.globalProductId },
    select: { id: true, globalProductId: true, tenantId: true }
  });
  if (!product) throw new Error("Product not found.");

    // 2. Unique code per variant
    const exists = await prisma.globalProductVariant.findFirst({
      where: {
        sku: dto.sku,
      },
    });
    if (exists) throw new Error("Variant SKU conflict.");

    // 3. Create
    const variant = await prisma.globalVariant.create({ data: dto });

    // 4. Audit
    await auditService.log({
      tenantId: tenantId,
      userId: userId,
      module: "global_variant",
      action: "create",
      entityId: variant.id,
      details: dto,
    });

    // 5. Cache
    await cacheService.del(
      CacheKeys.globalVariantList(variant.globalProductId)
    );

    // 6. Event
    eventBus.emit(EVENTS.GLOBAL_VARIANT_CREATED, {
      tenantId: tenantId,
      globalCategoryId: dto.globalProductId,
      globalVariantId: variant.id,
      userId,
    });

    logger.info(`Global Product Variant created: ${variant.name} ${variant.id}`);
    return variant;
  }

  async updateGlobalProductVariant(
    id: string,
    dto: UpdateGlobalProductVariantDto,
    userId: string
  ) {
    // Validate and update
    const variant = await prisma.globalProductVariant.update({
      where: { id },
      data: dto as any,
    });

  

    // Audit
    await auditService.log({
      tenantId: variant.tenantId,
      userId: userId,
      module: "global_variant",
      action: "update",
      entityId: id,
      details: dto,
    });

    // Cache
    await cacheService.del(
      CacheKeys.globalVariantList(variant.globalProductId)
    );
    await cacheService.del(
      CacheKeys.globalVariantDetail(
        variant.globalProductId,
        id
      )
    );

    // Event
    eventBus.emit(EVENTS.GLOBAL_VARIANT_UPDATED, {
      tenantId: variant.tenantId,
      globalProductId: variant.globalProductId,
      globalVariantId: id,
      changes: dto,
      userId,
    });

    logger.info(`Global Product Variant updated: ${id}`);
    return variant;
  }

  async deleteGlobalVariant(id: string, actorId: string) {
    const variant = await prisma.globalVariant.findUnique({ where: { id } });
    if (!variant) throw new Error("Not found.");

    // Delete
    await prisma.globalVariant.delete({ where: { id } });



    // Audit
    await auditService.log({
      tenantId: variant.tenantId,
      userId: actorId,
      module: "global_variant",
      action: "delete",
      entityId: id,
    });

    // Cache
    await cacheService.del(
      CacheKeys.globalVariantList(variant.globalProductId)
    );
    await cacheService.del(
      CacheKeys.globalVariantDetail(variant.globalProductId, variant.id)
    );

    // Event
    eventBus.emit(EVENTS.GLOBAL_PRODUCT_VARIANT_DELETED, {
      tenantId: variant.tenantId,
      globalCategoryId: variant.id,
      globalVariantId: id,
      actorId,
    });

    logger.info(`GlobalVariant deleted: ${id}`);
    return { success: true };
  }

  async getGlobalVariants(
    tenantId: string,
    globalProductId: string
  ) {
    const key = CacheKeys.globalVariantList(globalProductId);
    let list = await cacheService.get<any[]>(key);
    if (!list) {
      list = await prisma.globalProductVariant.findMany({
        where: { globalProductId },
      });
      await cacheService.set(key, list, 300);
    }
    return list;
  }

  async getGlobalVariantById(id: string) {
    const variant = await prisma.globalVariant.findUnique({ where: { id } });
    if (!variant) throw new Error("Not found.");
   
    if (!variant) throw new Error("variant not found.");
    const key = CacheKeys.globalVariantDetail(
      variant.id,
      id
    );
    let v = await cacheService.get<any>(key);
    if (!v) {
      v = variant;
      await cacheService.set(key, v, 300);
    }
    return v;
  }
}

export const globalVariantService = new GlobalVariantService();

