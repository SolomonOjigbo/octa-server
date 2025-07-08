// src/modules/product/services/category.service.ts
import { PrismaClient } from "@prisma/client";
import { CreateCategoryDto, UpdateCategoryDto } from "../types/product.dto";
import { cacheService } from "@cache/cache.service";
import { CacheKeys } from "@cache/cacheKeys";
import { auditService } from "@modules/audit/services/audit.service";
import { eventBus } from "@events/eventBus";
import { EVENTS } from "@events/events";
import {logger} from "@logging/logger";

const prisma = new PrismaClient();

export class CategoryService {
  async createCategory(dto: CreateCategoryDto, actorId: string) {
    // Ensure tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id: dto.tenantId } });
    if (!tenant) throw new Error("Tenant not found.");

    // Unique name per tenant
    const exists = await prisma.productCategory.findFirst({
      where: { name: dto.name, tenantId: dto.tenantId },
    });
    if (exists) throw new Error("Category name already exists for this tenant.");

    // Create
    const category = await prisma.productCategory.create({ data: dto });

    // Audit
    await auditService.log({
      tenantId: dto.tenantId,
      userId: actorId,
      module: "product_category",
      action: "create",
      entityId: category.id,
      details: dto,
    });

    // Event
    eventBus.emit(EVENTS.PRODUCT_CATEGORY_CREATED, {
      tenantId: dto.tenantId,
      categoryId: category.id,
      actorId,
    });

    // Cache
    await cacheService.del(CacheKeys.categoryList(dto.tenantId));

    logger.info(`Category created: ${category.id} (${category.name})`);
    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, actorId: string) {
    // Partial unique-name check
    if (dto.name) {
      const conflict = await prisma.productCategory.findFirst({
        where: { name: dto.name, tenantId: dto.tenantId!, id: { not: id } },
      });
      if (conflict) throw new Error("Category name already exists.");
    }

    const category = await prisma.productCategory.update({
      where: { id_tenantId: { id, tenantId: dto.tenantId! } },
      data: dto as any,
    });

    await auditService.log({
      tenantId: category.tenantId,
      userId: actorId,
      module: "product_category",
      action: "update",
      entityId: category.id,
      details: dto,
    });

    eventBus.emit(EVENTS.PRODUCT_CATEGORY_UPDATED, {
      tenantId: category.tenantId,
      categoryId: category.id,
      actorId,
    });

    await cacheService.del(CacheKeys.categoryList(category.tenantId));
    await cacheService.del(CacheKeys.categoryDetail(category.tenantId, category.id));

    logger.info(`Category updated: ${category.id}`);
    return category;
  }

  async deleteCategory(id: string, tenantId: string, actorId: string) {
    const category = await prisma.productCategory.delete({
      where: { id_tenantId: { id, tenantId } },
    });

    await auditService.log({
      tenantId,
      userId: actorId,
      module: "product_category",
      action: "delete",
      entityId: id,
    });

    eventBus.emit(EVENTS.PRODUCT_CATEGORY_DELETED, { tenantId, categoryId: id, actorId });

    await cacheService.del(CacheKeys.categoryList(tenantId));
    await cacheService.del(CacheKeys.categoryDetail(tenantId, id));

    logger.info(`Category deleted: ${id}`);
    return category;
  }

  async getCategories(tenantId: string) {
    const key = CacheKeys.categoryList(tenantId);
    let list = await cacheService.get<any[]>(key);
    if (!list) {
      list = await prisma.productCategory.findMany({ where: { tenantId } });
      await cacheService.set(key, list, 300);
    }
    return list;
  }

  async getCategoryById(id: string, tenantId: string) {
    const key = CacheKeys.categoryDetail(tenantId, id);
    let cat = await cacheService.get<any>(key);
    if (!cat) {
      cat = await prisma.productCategory.findUnique({
        where: { id_tenantId: { id, tenantId } },
      });
      if (!cat) throw new Error("Category not found.");
      await cacheService.set(key, cat, 300);
    }
    return cat;
  }
}

export const categoryService = new CategoryService();
