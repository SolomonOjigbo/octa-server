// src/modules/variantAttribute/services/variantAttribute.service.ts
import { CreateVariantAttributeDto, UpdateVariantAttributeDto, VariantAttributeResponseDto } from "../types/variantAttribute.dto";
import { cacheService } from "@cache/cache.service";
import { auditService } from "@modules/audit/services/audit.service";
import { eventBus } from "@events/eventBus";
import { EVENTS } from "@events/events";
import prisma from "@shared/infra/database/prisma";
import { AppError } from "@common/constants/app.errors";

export class VariantAttributeService {
  private cacheKey = "variant_attributes";

  async list(): Promise<VariantAttributeResponseDto[]> {
    const cached = await cacheService.get<VariantAttributeResponseDto[]>(this.cacheKey);
    if (cached) return cached;

    const attributes = await prisma.variantAttributes.findMany({
      orderBy: { name: "asc" }
    });

    const parsedAttributes = attributes.map(attr => ({
      ...attr,
      options: attr.options.map(opt => {
        try {
          return JSON.parse(opt);
        } catch {
          return {};
        }
      })
    }));

    await cacheService.set(this.cacheKey, parsedAttributes, 300);
    return parsedAttributes;
  }

  async getById(id: string): Promise<VariantAttributeResponseDto> {
    const attribute = await prisma.variantAttributes.findUnique({ where: { id } });
    if (!attribute) throw new AppError("Variant attribute not found", 404);
    return {
      ...attribute,
      options: attribute.options.map(opt => {
        try {
          return JSON.parse(opt);
        } catch {
          return {};
        }
      })
    };
  }

  async create(dto: CreateVariantAttributeDto, tenantId: string): Promise<VariantAttributeResponseDto> {
    const attribute = await prisma.variantAttributes.create({
      data: {
        name: dto.name,
        options: dto.options.map(opt => JSON.stringify(opt)),
        isActive: dto.isActive
      }
    });

    await cacheService.del(this.cacheKey);
    await auditService.log({
        tenantId,
      module: "VariantAttribute",
      action: "create",
      entityId: attribute.id,
      details: dto,
    });
    eventBus.emit(EVENTS.VARIANT_ATTRIBUTE_CREATED, attribute);

    return {
      ...attribute,
      options: attribute.options.map(opt => {
        try {
          return JSON.parse(opt);
        } catch {
          return {};
        }
      })
    };
  }

  async update(id: string, dto: UpdateVariantAttributeDto, tenantId: string): Promise<VariantAttributeResponseDto> {
    const attribute = await prisma.variantAttributes.update({
      where: { id },
      data: {
        name: dto.name,
        options: dto.options ? dto.options.map(opt => JSON.stringify(opt)) : undefined,
        isActive: dto.isActive
      }
    });

    await cacheService.del(this.cacheKey);
    await auditService.log({
        tenantId: tenantId,
      module: "VariantAttribute",
      action: "update",
      entityId: id,
      details: dto,
    });
    eventBus.emit(EVENTS.VARIANT_ATTRIBUTE_UPDATED, attribute);

    return {
      ...attribute,
      options: attribute.options.map(opt => {
        try {
          return JSON.parse(opt);
        } catch {
          return {};
        }
      })
    };
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const inUse = await prisma.globalVariant.count({ 
      where: { variantAttributes: { some: { id } } }}) > 0 || 
    await prisma.tenantVariant.count({ 
      where: { variantAttributes: { some: { id } } }}
    ) > 0;

    if (inUse) {
      throw new AppError("Cannot delete attribute in use by variants", 400);
    }

    await prisma.variantAttributes.delete({ where: { id } });
    await cacheService.del(this.cacheKey);
    await auditService.log({
        tenantId,
      module: "VariantAttribute",
      action: "delete",
      entityId: id,
      details: {},
    });
    eventBus.emit(EVENTS.VARIANT_ATTRIBUTE_DELETED, { id });
  }

  async toggleStatus(id: string): Promise<VariantAttributeResponseDto> {
    const attribute = await prisma.variantAttributes.findUnique({ where: { id } });
    if (!attribute) throw new AppError("Variant attribute not found", 404);

    const updated = await prisma.variantAttributes.update({
      where: { id },
      data: { isActive: !attribute.isActive }
    });

    await cacheService.del(this.cacheKey);
    eventBus.emit(EVENTS.VARIANT_ATTRIBUTE_UPDATED, updated);
    return {
      ...updated,
      options: updated.options.map(opt => {
        try {
          return JSON.parse(opt);
        } catch {
          return {};
        }
      })
    };
  }
}

export const variantAttributeService = new VariantAttributeService();