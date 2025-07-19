// src/modules/supplier/services/productSupplier.service.ts

import prisma from '@shared/infra/database/prisma';
import { CreateProductSupplierDto, CreateSupplierDto, UpdateProductSupplierDto } from '../types/supplier.dto';
import { b2bConnectionService } from '@modules/b2b/services/b2bConnection.service';
import { ProductSupplierDtoSchema } from '../validations';


export class ProductSupplierService {
  async linkProductToSupplier(input: CreateProductSupplierDto) {
    const dto = ProductSupplierDtoSchema.parse(input);
    const {
      tenantId,
      supplierId,
      productId,
      isGlobal = false,
    } = dto;

    // B2B Validation
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { tenantId: true },
    });

    if (!supplier) throw new Error('Supplier not found');
    if (supplier.tenantId !== tenantId) {
      const b2bApproved = await b2bConnectionService.ensureConnectionExists(tenantId, supplier.tenantId);
      if (!b2bApproved) throw new Error('Unauthorized: No approved B2B connection');
    }

    // Link product to supplier
    const existing = await prisma.productSupplier.findFirst({
      where: { tenantId, supplierId, productId },
    });

    if (existing) return existing;

    return prisma.productSupplier.create({
      data: { tenantId, supplierId, productId },
    });
  }

  async updateLink(id: string, dto: UpdateProductSupplierDto) {
      await b2bConnectionService.createOrUpdateWithSupplierProduct(
        dto.tenantId,
        dto.supplierId,
        dto.productId,
        dto.supplierId
      );
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
