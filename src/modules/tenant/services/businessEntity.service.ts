import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();


type BusinessEntity = Awaited<ReturnType<typeof prisma.businessEntity.create>>;

export class BusinessEntityService {
  async createEntity(data: Partial<BusinessEntity>): Promise<BusinessEntity> {
    return prisma.businessEntity.create({ data });
  }

  async getEntityById(id: string): Promise<BusinessEntity | null> {
    return prisma.businessEntity.findUnique({ where: { id } });
  }

  async updateEntity(id: string, data: Partial<BusinessEntity>): Promise<BusinessEntity> {
    return prisma.businessEntity.update({ where: { id }, data });
  }

  async deleteEntity(id: string): Promise<BusinessEntity> {
    return prisma.businessEntity.delete({ where: { id } });
  }

  async listEntitiesByTenant(tenantId: string): Promise<BusinessEntity[]> {
    return prisma.businessEntity.findMany({ where: { tenantId } });
  }
}
