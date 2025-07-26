// src/modules/supplier/services/supplier.se
import prisma from '@shared/infra/database/prisma';
import { CreateSupplierDto, UpdateSupplierDto } from '../types/supplier.dto';

export class SupplierService {
  async createSupplier(dto: CreateSupplierDto, tenantId: string) {
    return prisma.supplier.create({ data: {...dto, tenantId} });
  }
  async getSuppliers(tenantId: string) {
    return prisma.supplier.findMany({ where: { tenantId },  orderBy: { createdAt: 'desc' }, });
  }


  async getSupplierById(id: string) {
    return prisma.supplier.findUnique({ where: { id } });
  }

  async updateSupplier(id: string, dto: UpdateSupplierDto) {
    return prisma.supplier.update({ where: { id }, data: dto });
  }
  async deleteSupplier(id: string) {
    return prisma.supplier.delete({ where: { id } });
  }
}
export const supplierService = new SupplierService();
