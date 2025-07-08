import prisma from '@shared/infra/database/prisma';
import { CreateTenantProductVariantDto, UpdateTenantProductVariantDto } from '../types/tenantCatalog.dto';

export class TenantVariantService {
  async create(dto: CreateTenantProductVariantDto) {
    return prisma.tenantProductVariant.create({ data: dto });
  }
  async listByProduct(tenantProductId: string) {
    return prisma.tenantProductVariant.findMany({ where:{ tenantProductId } });
  }
  async update(id: string, dto: UpdateTenantProductVariantDto) {
    return prisma.tenantProductVariant.update({ where:{ id }, data: dto });
  }
  async delete(id: string) {
    return prisma.tenantProductVariant.delete({ where:{ id } });
  }
}
export const tenantVariantService = new TenantVariantService();
