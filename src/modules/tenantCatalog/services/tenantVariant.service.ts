// src/modules/tenantCatalog/services/tenantVariant.service.ts
import prisma from '@shared/infra/database/prisma';
import { CreateTenantProductVariantDto, UpdateTenantProductVariantDto } from '../types/tenantCatalog.dto';
import { cacheService } from "@cache/cache.service";
import { CacheKeys } from "@cache/cacheKeys";
import { auditService } from "@modules/audit/services/audit.service";
import { eventBus } from "@events/eventBus";
import { EVENTS } from "@events/events";
import {logger} from "@logging/logger";



export class TenantVariantService {
  async createVariant(
    dto: CreateTenantProductVariantDto,
    userId: string
  ) {
    // Validate product
    const prod = await prisma.tenantProduct.findUnique({ where: { id: dto.tenantProductId } });
    if (!prod) throw new Error("Product not found.");

    // Unique sku per product variant
    const dup = await prisma.tenantVariant.findFirst({
      where: { sku: dto.sku, tenantProductId: dto.tenantProductId },
    });
    if (dup) throw new Error("Variant code conflict.");

    // Create
    const variant = await prisma.tenantVariant.create({ data: dto });

    // Audit
    await auditService.log({
      tenantId: prod.tenantId,
      userId: userId,
      module: "tenant_variant",
      action: "create",
      entityId: variant.id,
      details: dto,
    });

    // Cache
    await cacheService.del(
      CacheKeys.tenantVariantList(prod.tenantId, dto.tenantProductId)
    );

    // Event
    eventBus.emit(EVENTS.TENANT_VARIANT_CREATED, {
      tenantId: prod.tenantId,
      tenantProductId: dto.tenantProductId,
      variantId: variant.id,
      userId: userId,
    });

    logger.info(`TenantVariant created: ${variant.id}`);
    return variant;
  }

  async updateVariant(
    id: string,
    dto: UpdateTenantProductVariantDto,
    userId: string,
  ) {
    const variant = await prisma.tenantVariant.update({
      where: { id },
      data: dto as UpdateTenantProductVariantDto,
    });
    const prod = await prisma.tenantProduct.findUnique({
      where: { id: variant.tenantProductId },
    });
    if (!prod) throw new Error("Product not found.");

    await auditService.log({
      tenantId: prod.tenantId,
      userId: userId,
      module: "tenant_variant",
      action: "update",
      entityId: id,
      details: dto,
    });

    await cacheService.del(
      CacheKeys.tenantVariantList( prod.tenantId, variant.tenantProductId)
    );
    await cacheService.del(
      CacheKeys.tenantVariantDetail( prod.tenantId, id)
    );

    eventBus.emit(EVENTS.TENANT_VARIANT_UPDATED, {
      tenantId: prod.tenantId,
      tenantProductId: prod.id,
      variantId: id,
      changes: dto,
      userId,
    });

    logger.info(`TenantVariant updated: ${id}`);
    return variant;
  }

  async deleteVariant(id: string, userId: string) {
    const variant = await prisma.tenantVariant.findUnique({ where: { id } });
    if (!variant) throw new Error("Not found.");
    const prod = await prisma.tenantProduct.findUnique({
      where: { id: variant.tenantProductId },
    });
    if (!prod) throw new Error("Product not found.");

    await prisma.tenantVariant.delete({ where: { id } });

    await auditService.log({
      tenantId: prod.tenantId,
      userId: userId,
      module: "tenant_variant",
      action: "delete",
      entityId: id,
    });

    await cacheService.del(
      CacheKeys.tenantVariantList( prod.tenantId,prod.tenantProductId)
    );
    await cacheService.del(
      CacheKeys.tenantVariantDetail(prod.tenantId, id)
    );

    eventBus.emit(EVENTS.TENANT_VARIANT_DELETED, {
      tenantId: prod.tenantId,
      tenantProductId: prod.id,
      variantId: id,
      userId,
    });

    logger.info(`TenantVariant deleted: ${id}`);
    return { success: true };
  }

  async getVariants(tenantId: string, tenantProductId: string) {
    const key = CacheKeys.tenantVariantList(tenantId, tenantProductId);
    let list = await cacheService.get<any[]>(key);
    if (!list) {
      list = await prisma.tenantVariant.findMany({ where: { tenantProductId } });
      await cacheService.set(key, list, 300);
    }
    return list;
  }

  async getVariantById(id: string) {
    const variant = await prisma.tenantVariant.findUnique({ where: { id } });
    if (!variant) throw new Error("Not found.");
    const prod = await prisma.tenantProduct.findUnique({
      where: { id: variant.tenantProductId },
    });
    if (!prod) throw new Error("Product not found.");
    const key = CacheKeys.tenantVariantDetail(prod.tenantId, prod.id);
    let v = await cacheService.get<any>(key);
    if (!v) {
      v = variant;
      await cacheService.set(key, v, 300);
    }
    return v;
  }
}

export const tenantVariantService = new TenantVariantService();

