
import prisma from '@shared/infra/database/prisma';
import { CreateGlobalCategoryDto, UpdateGlobalCategoryDto } from '../types/globalCatalog.dto';

export class GlobalCategoryService {
  async create(dto: CreateGlobalCategoryDto) {
    return prisma.globalCategory.create({ data: dto });
  }
  async list() {
    return prisma.globalCategory.findMany({ include: { subcategories: true } });
  }
  async getById(id: string) {
    return prisma.globalCategory.findUnique({ where: { id }, include:{ subcategories:true } });
  }
  async update(id: string, dto: UpdateGlobalCategoryDto) {
    return prisma.globalCategory.update({ where:{ id }, data: dto });
  }
  async delete(id: string) {
    return prisma.globalCategory.delete({ where:{ id } });
  }
}
export const globalCategoryService = new GlobalCategoryService();
