// src/modules/supplier/services/productSupplier.service.ts


import prisma from '@shared/infra/database/prisma';
import { CreateProductSupplierDto, UpdateProductSupplierDto } from '../types/supplier.dto';

export class ProductSupplierService {
  linkProductToSupplier(dto: CreateProductSupplierDto) {
    return prisma.productSupplier.create({ data: dto });
  }
  updateLink(id: string, dto: UpdateProductSupplierDto) {
    return prisma.productSupplier.update({ where: { id }, data: dto });
  }
  unlinkProduct(id: string) {
    return prisma.productSupplier.delete({ where: { id } });
  }
  getLinksForProduct(productId: string, tenantId: string) {
    return prisma.productSupplier.findMany({ where: { productId, tenantId }, include: { supplier: true } });
  }
}
export const productSupplierService = new ProductSupplierService();
