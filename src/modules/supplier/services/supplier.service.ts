import { PrismaClient} from "@prisma/client";
import { CreateSupplierDto, UpdateSupplierDto } from "../types/supplier.dto";

const prisma = new PrismaClient();


type Supplier = Awaited<ReturnType<typeof prisma.supplier.create>>;

export class SupplierService {
  static createSupplier(validated: { tenantId?: string; name?: string; email?: string; phone?: string; address?: string; paymentTerms?: string; leadTime?: number; notes?: string; }) {
      throw new Error("Method not implemented.");
  }
  static getSuppliers(tenantId: string) {
      throw new Error("Method not implemented.");
  }
  static updateSupplier(id: string, validated: { tenantId?: string; name?: string; email?: string; phone?: string; address?: string; paymentTerms?: string; leadTime?: number; notes?: string; }) {
      throw new Error("Method not implemented.");
  }
  static deleteSupplier(id: string) {
      throw new Error("Method not implemented.");
  }
  async createSupplier(dto: CreateSupplierDto): Promise<Supplier> {
    return prisma.supplier.create({ data: dto });
  }

  async getSuppliers(tenantId: string): Promise<Supplier[]> {
    return prisma.supplier.findMany({ where: { tenantId } });
  }

  async getSupplierById(tenantId: string, id: string): Promise<Supplier | null> {
    return prisma.supplier.findFirst({ where: { id, tenantId } });
  }

  async updateSupplier(id: string, data: UpdateSupplierDto): Promise<Supplier | null> {
    return prisma.supplier.update({ where: { id }, data });
  }

  async deleteSupplier(id: string): Promise<Supplier | null> {
    return prisma.supplier.delete({ where: { id } });
  }

  // (Optional) Link/unlink products to suppliers for ProductSupplier management
  async linkProductToSupplier(supplierId: string, productId: string) {
    return prisma.productSupplier.create({
      data: {
        supplierId,
        productId,
        tenantId: (await prisma.supplier.findUnique({ where: { id: supplierId } }))?.tenantId!,
      },
    });
  }

  async unlinkProductFromSupplier(productSupplierId: string) {
    return prisma.productSupplier.delete({ where: { id: productSupplierId } });
  }
}

export const supplierService = new SupplierService();
