
import prisma from '@shared/infra/database/prisma';
import { CreateGlobalProductVariantDto, UpdateGlobalProductVariantDto } from '../types/globalCatalog.dto';
import { cacheService } from "@cache/cache.service";
import { CacheKeys } from "@cache/cacheKeys";
import { auditService } from "@modules/audit/services/audit.service";
import { eventBus } from "@events/eventBus";
import { EVENTS } from "@events/events";
import {logger } from "@logging/logger";
import { Prisma } from '@prisma/client';



export class GlobalVariantService {
async createGlobalProductVariant(
  tenantId: string,
  userId: string,
  dto: CreateGlobalProductVariantDto,
) {
  // 1. Verify parent product exists and is variable
  const parentProduct = await prisma.globalProduct.findUnique({
    where: { id: dto.globalProductId },
    select: { 
      id: true,
      isVariable: true,
      globalCategoryId: true 
    }
  });

  if (!parentProduct) {
    throw new Error("Parent product not found");
  }

  if (!parentProduct.isVariable) {
    throw new Error("Cannot add variants to a non-variable product");
  }

  // 2. Check for SKU uniqueness (scoped to the product)
  const existingVariant = await prisma.globalVariant.findFirst({
    where: {
      sku: dto.sku,
      globalProductId: dto.globalProductId
    },
  });

  if (existingVariant) {
    throw new Error(`Variant SKU '${dto.sku}' already exists for this product`);
  }

  // 3. Validate variant attributes exist
  const attributeIds = dto.variantAttributes.map(attr => attr.id);
  const existingAttributes = await prisma.variantAttributes.findMany({
    where: { id: { in: attributeIds } },
    select: { id: true }
  });

  if (existingAttributes.length !== dto.variantAttributes.length) {
    const missingIds = attributeIds.filter(
      id => !existingAttributes.some(attr => attr.id === id)
    );
    throw new Error(`Variant attributes not found: ${missingIds.join(', ')}`);
  }

  // 4. Prepare variant data with proper Prisma types
  const variantData: Prisma.GlobalVariantCreateInput = {
    name: dto.name,
    sku: dto.sku,
    costPrice: dto.costPrice,
    sellingPrice: dto.sellingPrice,
    ...(dto.imageUrl && { imageUrl: dto.imageUrl }),
    ...(dto.stock && { stock: dto.stock }),
    product: {
      connect: { id: dto.globalProductId }
    },
    variantAttributes: {
      connect: dto.variantAttributes.map(attr => ({ id: attr.id }))
    }
  };

  // 5. Create variant within a transaction
  const variant = await prisma.$transaction(async (tx) => {
    const newVariant = await tx.globalVariant.create({
      data: variantData,
      include: {
        variantAttributes: true
      }
    });

    // Audit log
    await auditService.log({
      tenantId,
      userId,
      module: "global_variant",
      action: "create",
      entityId: newVariant.id,
      details: {
        ...dto,
        variantAttributes: newVariant.variantAttributes.map(attr => attr.id)
      },
    });

    return newVariant;
  });

  // 6. Cache invalidation
  await cacheService.del(CacheKeys.globalVariantList(dto.globalProductId));
  await cacheService.del(CacheKeys.globalProductDetail(dto.globalProductId));

  // 7. Event emission
  eventBus.emit(EVENTS.GLOBAL_VARIANT_CREATED, {
    tenantId,
    globalProductId: dto.globalProductId,
    globalVariantId: variant.id,
    userId,
    variantAttributes: variant.variantAttributes.map(attr => attr.id)
  });

  logger.info(`Created variant ${variant.id} for product ${dto.globalProductId}`);
  return variant;
}

  async updateGlobalProductVariant(
    id: string,
    userId: string,
    tenantId: string,
    dto: UpdateGlobalProductVariantDto,
  ) {
    // Validate and update
    const variant = await prisma.globalVariant.update({
      where: { id },
      data: dto as any,
    });

  

    // Audit
    await auditService.log({
      tenantId: tenantId,
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
      tenantId: tenantId,
      globalProductId: variant.globalProductId,
      globalVariantId: id,
      changes: dto,
      userId,
    });

    logger.info(`Global Product Variant updated: ${id}`);
    return variant;
  }

  async deleteGlobalVariant(id: string, actorId: string, tenantId: string) {
    const variant = await prisma.globalVariant.findUnique({ where: { id } });
    if (!variant) throw new Error("Not found.");

    // Delete
    await prisma.globalVariant.delete({ where: { id } });



    // Audit
    await auditService.log({
      tenantId: tenantId,
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
      tenantId: tenantId,
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
      list = await prisma.globalVariant.findMany({
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

