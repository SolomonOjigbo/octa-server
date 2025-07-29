
// src/modules/tenantCatalog/services/tenantCategory.service.ts
import prisma from '@shared/infra/database/prisma';
import { CreateTenantCategoryDto, UpdateTenantCategoryDto } from '../types/tenantCatalog.dto';
import { cacheService } from "@cache/cache.service";
import { CacheKeys } from "@cache/cacheKeys";
import { auditService } from "@modules/audit/services/audit.service";
import { eventBus } from "@events/eventBus";
import { EVENTS } from "@events/events";
import {logger} from "@logging/logger";


export class TenantCategoryService {
  async createCategory(
    actorId: string,
    dto: CreateTenantCategoryDto
  ) {
    // Unique per tenant
    const exists = await prisma.tenantCategory.findFirst({
      where: { name: dto.name, tenantId: dto.tenantId },
    });
    if (exists) throw new Error("Category exists.");

    const category = await prisma.tenantCategory.create({ data: dto });

    await auditService.log({
      tenantId: dto.tenantId,
      userId: actorId,
      module: "tenant_category",
      action: "create",
      entityId: category.id,
      details: dto,
    });

    await cacheService.del(CacheKeys.tenantCategoryList(dto.tenantId));

    eventBus.emit(EVENTS.TENANT_CATEGORY_CREATED, {
      tenantId: dto.tenantId,
      categoryId: category.id,
      name: category.name,
      actorId,
    });

    logger.info(`TenantCategory created: ${category.id}`);
    return category;
  }

  async updateCategory(
    id: string,
    dto: UpdateTenantCategoryDto,
    actorId: string
  ) {
    if (dto.name) {
      const dup = await prisma.tenantCategory.findFirst({
        where: { name: dto.name, tenantId: dto.tenantId!, id: { not: id } },
      });
      if (dup) throw new Error("Name conflict.");
    }

    const category = await prisma.tenantCategory.update({
      where:  { id } ,
      data: dto as any,
    });

    await auditService.log({
      tenantId: category.tenantId,
      userId: actorId,
      module: "tenant_category",
      action: "update",
      entityId: id,
      details: dto,
    });

    await cacheService.del(CacheKeys.tenantCategoryList(category.tenantId));
    await cacheService.del(
      CacheKeys.tenantCategoryDetail(category.tenantId, id)
    );

    eventBus.emit(EVENTS.TENANT_CATEGORY_UPDATED, {
      tenantId: category.tenantId,
      categoryId: id,
      changes: dto,
      actorId,
    });

    logger.info(`TenantCategory updated: ${id}`);
    return category;
  }

  async deleteCategory(id: string, tenantId: string, actorId: string) {
    const category = await prisma.tenantCategory.findUnique({ where: { id } });
    if (!category || category.tenantId !== tenantId) throw new Error("Not found.");

    await prisma.tenantCategory.delete({ where: { id } });

    await auditService.log({
      tenantId,
      userId: actorId,
      module: "tenant_category",
      action: "delete",
      entityId: id,
    });

    await cacheService.del(CacheKeys.tenantCategoryList(tenantId));
    await cacheService.del(CacheKeys.tenantCategoryDetail(tenantId, id));

    eventBus.emit(EVENTS.TENANT_CATEGORY_DELETED, {
      tenantId,
      categoryId: id,
      actorId,
    });

    logger.info(`TenantCategory deleted: ${id}`);
    return { success: true };
  }

  async getCategories(tenantId: string) {
    const key = CacheKeys.tenantCategoryList(tenantId);
    let list = await cacheService.get<any[]>(key);
    if (!list) {
      list = await prisma.tenantCategory.findMany({ where: { tenantId } });
      await cacheService.set(key, list, 300);
    }
    return list;
  }

  async getCategoryById(id: string) {
    const category = await prisma.tenantCategory.findUnique({ where: { id } });
    if (!category) throw new Error("Not found.");
    const key = CacheKeys.tenantCategoryDetail(category.tenantId, id);
    let c = await cacheService.get<any>(key);
    if (!c) {
      c = category;
      await cacheService.set(key, c, 300);
    }
    return c;
  }
}

export const tenantCategoryService = new TenantCategoryService();
