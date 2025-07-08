
import prisma from '@shared/infra/database/prisma';
import { CreateTenantCategoryDto, UpdateTenantCategoryDto } from '../types/tenantCatalog.dto';

export class TenantCategoryService {
  async create(dto: CreateTenantCategoryDto) {
    return prisma.tenantCategory.create({ data: dto });
  }
  async list(tenantId: string) {
    return prisma.tenantCategory.findMany({ where:{ tenantId }, include:{ subcategories:true } });
  }
  async getById(id: string) {
    return prisma.tenantCategory.findUnique({ where:{ id }, include:{ subcategories:true } });
  }
  async update(id: string, dto: UpdateTenantCategoryDto) {
    return prisma.tenantCategory.update({ where:{ id }, data: dto });
  }
  async delete(id: string) {
    return prisma.tenantCategory.delete({ where:{ id } });
  }
}
export const tenantCategoryService = new TenantCategoryService();
