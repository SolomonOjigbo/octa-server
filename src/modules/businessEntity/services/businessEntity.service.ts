import { PrismaClient } from "@prisma/client";
import { BusinessEntityDto, CreateBusinessEntityDto, UpdateBusinessEntityDto } from "../types/businessEntity.dto";

const prisma = new PrismaClient();

export class BusinessEntityService {
  async createEntity(dto: CreateBusinessEntityDto) {
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






