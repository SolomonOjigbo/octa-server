// src/modules/product/services/productVariants.service.ts
import { PrismaClient } from "@prisma/client";
import { ProductVariantDto } from "../types/product.dto";
import { cacheService } from "@cache/cache.service";
import { CacheKeys } from "@cache/cacheKeys";
import { auditService } from "@modules/audit/services/audit.service";
import { eventBus } from "@events/eventBus";
import { EVENTS } from "@events/events";
import { logger } from "@logging/logger";

const prisma = new PrismaClient();

export class ProductVariantService {
  async createVariant(
    productId: string,
    dto: ProductVariantDto,
    actorId: string
  ) {
    // Validate product + tenant
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found.");

    // Create variant
    const variant = await prisma.productVariant.create({
      data: { ...dto, productId },
    });

    // Audit
    await auditService.log({
      tenantId: product.tenantId,
      userId: actorId,
      module: "product_variant",
      action: "create",
      entityId: variant.id,
      details: dto,
    });

    // Event
    eventBus.emit(EVENTS.PRODUCT_VARIANT_CREATED, {
      tenantId: product.tenantId,
      productId,
      variantId: variant.id,
      actorId,
    });

    // Cache
    await cacheService.del(CacheKeys.variantList(product.tenantId));

    logger.info(`Variant created: ${variant.id} for product ${productId}`);
    return variant;
  }

  async updateVariant(
    id: string,
    productId: string,
    dto: Partial<ProductVariantDto>,
    actorId: string
  ) {
    // Ensure product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found.");

    // Update
    const variant = await prisma.productVariant.update({
      where: { id_productId: { id, productId } },
      data: dto as any,
    });

    // Audit
    await auditService.log({
      tenantId: product.tenantId,
      userId: actorId,
      module: "product_variant",
      action: "update",
      entityId: variant.id,
      details: dto,
    });

    // Event
    eventBus.emit(EVENTS.PRODUCT_VARIANT_UPDATED, {
      tenantId: product.tenantId,
      productId,
      variantId: variant.id,
      actorId,
    });

    // Cache
    await cacheService.del(CacheKeys.variantList(product.tenantId));
    await cacheService.del(CacheKeys.variantDetail(product.tenantId, productId));

    logger.info(`Variant updated: ${variant.id}`);
    return variant;
  }

  async deleteVariant(
    id: string,
    productId: string,
    actorId: string
  ) {
    // Fetch product for tenant
    const variant = await prisma.productVariant.findUnique({
      where: { id_productId: { id, productId } },
    });
    if (!variant) throw new Error("Variant not found.");

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found.");

    // Delete
    await prisma.productVariant.delete({ where: { id_productId: { id, productId } } });

    // Audit
    await auditService.log({
      tenantId: product.tenantId,
      userId: actorId,
      module: "product_variant",
      action: "delete",
      entityId: id,
    });

    // Event
    eventBus.emit(EVENTS.PRODUCT_VARIANT_DELETED, {
      tenantId: product.tenantId,
      productId,
      variantId: id,
      actorId,
    });

    // Cache
    await cacheService.del(CacheKeys.variantList(product.tenantId));
    await cacheService.del(CacheKeys.variantDetail(product.tenantId, productId));

    logger.info(`Variant deleted: ${id}`);
    return { success: true };
  }

  async getVariants(productId: string) {
    // Fetch product for tenant
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found.");

    const key = CacheKeys.variantList(product.tenantId);
    let list = await cacheService.get<any[]>(key);
    if (!list) {
      list = await prisma.productVariant.findMany({ where: { productId } });
      await cacheService.set(key, list, 300);
    }
    return list;
  }

  async getVariantById(id: string, productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found.");

    const key = CacheKeys.variantDetail(product.tenantId, productId);
    let v = await cacheService.get<any>(key);
    if (!v) {
      v = await prisma.productVariant.findUnique({
        where: { id_productId: { id, productId } },
      });
      if (!v) throw new Error("Variant not found.");
      await cacheService.set(key, v, 300);
    }
    return v;
  }
}

export const productVariantService = new ProductVariantService();
