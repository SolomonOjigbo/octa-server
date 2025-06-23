import { PrismaClient} from "@prisma/client";
const prisma = new PrismaClient();


type Supplier = Awaited<ReturnType<typeof prisma.supplier.create>>;

export class ProductSupplierService {
  async createSupplier(data: Partial<Supplier>): Promise<Supplier> {
    return prisma.supplier.create({ data });
  }

  async getSupplierById(id: string): Promise<Supplier | null> {
    return prisma.supplier.findUnique({ where: { id } });
  }

  async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier> {
    return prisma.supplier.update({ where: { id }, data });
  }

  async deleteSupplier(id: string): Promise<Supplier> {
    return prisma.supplier.delete({ where: { id } });
  }

  async listSuppliersByTenant(tenantId: string): Promise<Supplier[]> {
    return prisma.supplier.findMany({ where: { tenantId } });
  }
}
