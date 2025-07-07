// src/modules/supplier/services/supplier.se
import prisma from '@shared/infra/database/prisma';
import { CreateSupplierDto, UpdateSupplierDto } from '../types/supplier.dto';

export class SupplierService {
  createSupplier(dto: CreateSupplierDto) {
    return prisma.supplier.create({ data: dto });
  }
  getSuppliers(tenantId: string) {
    return prisma.supplier.findMany({ where: { tenantId } });
  }
  updateSupplier(id: string, dto: UpdateSupplierDto) {
    return prisma.supplier.update({ where: { id }, data: dto });
  }
  deleteSupplier(id: string) {
    return prisma.supplier.delete({ where: { id } });
  }
}
export const supplierService = new SupplierService();
