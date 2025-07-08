import prisma from '@shared/infra/database/prisma';
import { CreateTenantProductDto, UpdateTenantProductDto } from '../types/tenantCatalog.dto';

export class TenantProductService {
  async create(dto: CreateTenantProductDto) {
    return prisma.tenantProduct.create({ data: dto });
  }
  async listByCategory(tenantId: string, categoryId?: string) {
    return prisma.tenantProduct.findMany({
      where:{ tenantId, ...(categoryId && { tenantCategoryId:categoryId }) }
    });
  }
  async getById(id: string) {
    return prisma.tenantProduct.findUnique({ where:{ id }, include:{ variants:true, globalProduct:true } });
  }
  async update(id: string, dto: UpdateTenantProductDto) {
    return prisma.tenantProduct.update({ where:{ id }, data: dto });
  }
  async delete(id: string) {
    return prisma.tenantProduct.delete({ where:{ id } });
  }
}
export const tenantProductService = new TenantProductService();
