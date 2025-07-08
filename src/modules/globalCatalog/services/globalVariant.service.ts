
import prisma from '@shared/infra/database/prisma';
import { CreateGlobalProductVariantDto, UpdateGlobalProductVariantDto } from '../types/globalCatalog.dto';

export class GlobalVariantService {
  async create(dto: CreateGlobalProductVariantDto) {
    return prisma.globalProductVariant.create({ data: dto });
  }
  async listByProduct(globalProductId: string) {
    return prisma.globalProductVariant.findMany({ where:{ globalProductId } });
  }
  async update(id: string, dto: UpdateGlobalProductVariantDto) {
    return prisma.globalProductVariant.update({ where:{ id }, data: dto });
  }
  async delete(id: string) {
    return prisma.globalProductVariant.delete({ where:{ id } });
  }
}
export const globalVariantService = new GlobalVariantService();
