import prisma from '@shared/infra/database/prisma';
import { CreateVariantDto, UpdateVariantDto } from '../types/product.dto';
import { AppError } from '@common/constants/app.errors';

export const productVariantService = {
  createVariant: async (tenantId: string, data: CreateVariantDto) => {
    return await prisma.productVariant.create({
      data: { ...data, tenantId }
    });
  },

  updateVariant: async (id: string, tenantId: string, data: UpdateVariantDto) => {
    const existing = await prisma.productVariant.findFirst({ where: { id, tenantId } });
    if (!existing) throw new AppError('Variant not found', 404);
    return await prisma.productVariant.update({
      where: { id },
      data,
    });
  },

  deleteVariant: async (id: string, tenantId: string) => {
    const existing = await prisma.productVariant.findFirst({ where: { id, tenantId } });
    if (!existing) throw new AppError('Variant not found', 404);
    await prisma.productVariant.delete({ where: { id } });
  },

  getVariantsByProduct: async (productId: string, tenantId: string) => {
    return await prisma.productVariant.findMany({
      where: { productId, tenantId },
    });
  },
};
