import { PrismaClient} from "@prisma/client";
const prisma = new PrismaClient();

export class TenantService {
  async createTenant(data){
    return prisma.tenant.create({ data });
  }

  async getTenantById (id: string){
    return prisma.tenant.findUnique({ where: { id } });
  }

  async updateTenant(id: string, data: any) {
    return prisma.tenant.update({ where: { id }, data });
  }

  async deleteTenant(id: string){
    return prisma.tenant.delete({ where: { id } });
  }

  async listTenants() {
    return prisma.tenant.findMany();
  }

  // Custom example: Get tenants with B2B connections
  async getTenantsWithB2B() {
    return prisma.tenant.findMany({
      include: {
        b2bConnectionsA: true,
        b2bConnectionsB: true
      }
    });
  }
}
