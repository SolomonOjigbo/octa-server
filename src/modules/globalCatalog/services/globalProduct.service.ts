import prisma from '@shared/infra/database/prisma';
import { CreateGlobalProductDto, UpdateGlobalProductDto } from '../types/globalCatalog.dto';

export class GlobalProductService {
  async create(dto: CreateGlobalProductDto) {
    return prisma.globalProduct.create({ data: dto });
  }
  async listByCategory(categoryId: string) {
    return prisma.globalProduct.findMany({ where:{ globalCategoryId: categoryId } });
  }
  async getById(id: string) {
    return prisma.globalProduct.findUnique({ where:{ id }, include:{ variants:true } });
  }
  async update(id: string, dto: UpdateGlobalProductDto) {
    return prisma.globalProduct.update({ where:{ id }, data: dto });
  }
  async delete(id: string) {
    return prisma.globalProduct.delete({ where:{ id } });
  }
}
export const globalProductService = new GlobalProductService();
