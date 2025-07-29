// src/modules/globalCatalog/services/globalCategory.service.ts

import prisma from "@shared/infra/database/prisma";
import { CreateGlobalCategoryDto, UpdateGlobalCategoryDto } from "../types/globalCatalog.dto";
import { cacheService } from "@cache/cache.service";
import { CacheKeys } from "@cache/cacheKeys";
import { auditService } from "@modules/audit/services/audit.service";
import { eventBus } from "@events/eventBus";
import { EVENTS } from "@events/events";
import {logger }from "@logging/logger";
import { createGlobalCategorySchema, updateGlobalCategorySchema } from "../validations";
import { Prisma } from "@prisma/client";


const MAX_CATEGORY_DEPTH = 5;

export class GlobalCategoryService {
  
  async create(tenantId: string, actorId: string, dto: CreateGlobalCategoryDto) {
    const data = createGlobalCategorySchema.parse(dto);

    // Prevent cycles: parentId != self && no ancestor loop
    const exists = await prisma.globalCategory.findUnique({ where: { name: data.name } });
    if (exists) throw new Error("Category name must be unique.");

    if (data.parentId) {
      await this.validateParentCategory(data.parentId);
    }


    const createData: Prisma.GlobalCategoryCreateInput = {
    name: data.name,
    ...(data.imageUrl && { imageUrl: data.imageUrl }),
    ...(data.description && { description: data.description }),
    ...(data.parentId && {
      parent: {
        connect: { id: data.parentId }
      }
    })
  };

   const cat = await prisma.globalCategory.create({ 
    data: createData
  });

    await auditService.log({ tenantId, userId: actorId, module: "global_category", action: "create", entityId: cat.id, details: data });
    cacheService.del(CacheKeys.globalCategoryList());
    eventBus.emit(EVENTS.GLOBAL_CATEGORY_CREATED, { categoryId: cat.id, name: cat.name, actorId });

    logger.info(`Created GlobalCategory ${cat.id}`);
    return cat;
  }

  async update( tenantId: string, actorId: string, id:string, dto: UpdateGlobalCategoryDto) {
    const data = updateGlobalCategorySchema.parse(dto);

    const conflict = await prisma.globalCategory.findFirst({
      where: { name: data.name, id: { not: data.id } }
    });
    if (conflict) throw new Error("Category name conflict.");

    const cat = await prisma.globalCategory.update({
      where: { id: data.id },
      data
    });

    await auditService.log({ tenantId:tenantId, userId: actorId, module: "global_category", action: "update", entityId: cat.id, details: data });
    cacheService.del(CacheKeys.globalCategoryList());
    cacheService.del(CacheKeys.globalCategoryDetail(cat.id));
    eventBus.emit(EVENTS.GLOBAL_CATEGORY_UPDATED, { categoryId: cat.id, changes: data, actorId });

    logger.info(`Updated GlobalCategory ${cat.id}`);
    return cat;
  }

  async delete(id: string, tenantId: string, actorId: string) {
    const cat = await prisma.globalCategory.findUnique({ where: { id } });
    if (!cat) throw new Error("Not found.");

    await prisma.globalCategory.delete({ where: { id } });
    await auditService.log({ tenantId:tenantId, userId: actorId, module: "global_category", action: "delete", entityId: id });
    cacheService.del(CacheKeys.globalCategoryList());
    cacheService.del(CacheKeys.globalCategoryDetail(id));
    eventBus.emit(EVENTS.GLOBAL_CATEGORY_DELETED, { categoryId: id, actorId });

    logger.info(`Deleted GlobalCategory ${id}`);
    return { success: true };
  }

  async list() {
    const key = CacheKeys.globalCategoryList();
    let list = await cacheService.get(key);
    if (!list) {
      list = await prisma.globalCategory.findMany({ where: { parentId: null } });
      cacheService.set(key, list, 300);
    }
    return list;
  }

  async detail(id: string) {
    const key = CacheKeys.globalCategoryDetail(id);
    let cat = await cacheService.get(key);
    if (!cat) {
      cat = await prisma.globalCategory.findUnique({ where: { id }, include: { subcategories: true } });
      if (!cat) throw new Error("Not found.");
      cacheService.set(key, cat, 300);
    }
    return cat;
  }
private async validateParentCategory(parentId: string) {
    // 1. Verify parent exists
    const parent = await prisma.globalCategory.findUnique({
      where: { id: parentId },
      select: { parentId: true }
    });
    if (!parent) throw new Error("Parent category not found");

    // 2. Check if creating this would cause a cycle (indirectly)
    // Since we don't have the new category's ID yet, we can't do full cycle detection
    // But we can prevent deep nesting by limiting depth
    const depth = await this.getCategoryDepth(parentId);
    if (depth >= MAX_CATEGORY_DEPTH) {
      throw new Error(`Maximum category depth of ${MAX_CATEGORY_DEPTH} exceeded`);
    }
  }

  async getCategoryDepth(categoryId: string, currentDepth = 1): Promise<number> {
    const category = await prisma.globalCategory.findUnique({
      where: { id: categoryId },
      select: { parentId: true }
    });

    if (!category?.parentId) return currentDepth;
    return this.getCategoryDepth(category.parentId, currentDepth + 1);
  }

  async getCategoryTree(id: string) {
    return prisma.globalCategory.findUnique({
      where: { id },
      include: {
        parent: true, // Include immediate parent
        subcategories: {
          include: {
            subcategories: true // Recursive include
          }
        }
      }
    });
  }

}

export const globalCategoryService = new GlobalCategoryService();
