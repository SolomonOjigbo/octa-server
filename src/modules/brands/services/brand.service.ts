// src/modules/brand/services/brand.service.ts
import { CreateBrandDto, UpdateBrandDto, BrandResponseDto } from "../types/brand.dto";
import { cacheService } from "@cache/cache.service";
import { auditService } from "@modules/audit/services/audit.service";
import { eventBus } from "@events/eventBus";
import { EVENTS } from "@events/events";
import prisma from "@shared/infra/database/prisma";
import { AppError } from "@common/constants/app.errors";

export class BrandService {
  private cacheKey = "brands";

  async list(): Promise<BrandResponseDto[]> {
    const cached = await cacheService.get<BrandResponseDto[]>(this.cacheKey);
    if (cached) return cached;

    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" }
    });

    await cacheService.set(this.cacheKey, brands, 300);
    return brands;
  }

  async getById(id: string): Promise<BrandResponseDto> {
    const brand = await prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new AppError("Brand not found", 404);
    return brand;
  }

  async create(dto: CreateBrandDto, tenantId: string): Promise<BrandResponseDto> {
    const brand = await prisma.brand.create({
      data: {
        name: dto.name,
        isActive: dto.isActive,
        description: dto.description,
        logoUrl: dto.logoUrl,
        website: dto.website,
        tenant: { connect: { id: tenantId } }
      }
    });

    await cacheService.del(this.cacheKey);
    await auditService.log({
      tenantId,
      module: "Brand",
      action: "create",
      entityId: brand.id,
      details: dto,
    });
    eventBus.emit(EVENTS.BRAND_CREATED, brand);

    return brand;
  }

  async update(id: string, dto: UpdateBrandDto, tenantId:string): Promise<BrandResponseDto> {
    const brand = await prisma.brand.update({
      where: { id },
      data: dto
    });

    await cacheService.del(this.cacheKey);
    await auditService.log({
        tenantId,
      module: "Brand",
      action: "update",
      entityId: id,
      details: dto,
    });
    eventBus.emit(EVENTS.BRAND_UPDATED, brand);

    return brand;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const inUse = await prisma.globalProduct.count({ 
      where: { brand: id } 
    }) > 0 || 
    await prisma.tenantProduct.count({ 
      where: { brand: id } 
    }) > 0;

    if (inUse) {
      throw new AppError("Cannot delete brand in use by products", 400);
    }

    await prisma.brand.delete({ where: { id } });
    await cacheService.del(this.cacheKey);
    await auditService.log({
        tenantId,
      module: "Brand",
      action: "delete",
      entityId: id,
      details: {},
    });
    eventBus.emit(EVENTS.BRAND_DELETED, { id });
  }

  async toggleStatus(id: string): Promise<BrandResponseDto> {
    const brand = await prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new AppError("Brand not found", 404);

    const updated = await prisma.brand.update({
      where: { id },
      data: { isActive: !brand.isActive }
    });

    await cacheService.del(this.cacheKey);
    eventBus.emit(EVENTS.BRAND_UPDATED, updated);
    return updated;
  }
}

export const brandService = new BrandService();