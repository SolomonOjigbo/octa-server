import prisma from "@shared/infra/database/prisma";
import { BusinessEntityDto, CreateBusinessEntityDto, UpdateBusinessEntityDto } from "../types/businessEntity.dto";



export class BusinessEntityService {
async createEntity(dto: CreateBusinessEntityDto) {
    // Check that tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id: dto.tenantId } });
    if (!tenant) throw new Error("Invalid tenantId: Tenant not found.");

    // Ensure name uniqueness within tenant (optional, for DDD correctness)
    const existing = await prisma.businessEntity.findFirst({
      where: { tenantId: dto.tenantId, name: dto.name },
    });
    if (existing) throw new Error("BusinessEntity name already exists for this tenant.");

    return prisma.businessEntity.create({ data: dto });
  }

  async updateEntity(id: string, dto: UpdateBusinessEntityDto) {
    return prisma.businessEntity.update({ where: { id }, data: dto });
  }

  async getEntities(tenantId: string) {
    return prisma.businessEntity.findMany({ where: { tenantId } });
  }

  async getEntityById(id: string) {
    return prisma.businessEntity.findUnique({ where: { id } });
  }

    async deleteEntity(id: string){
    return prisma.businessEntity.delete({ where: { id } });
  }

  async listEntitiesByTenant(tenantId: string): Promise<BusinessEntityDto[]> {
    return prisma.businessEntity.findMany({ where: { tenantId } });
  }
}

export const businessEntityService = new BusinessEntityService();






