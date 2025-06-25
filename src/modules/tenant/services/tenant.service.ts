
import { PrismaClient } from "@prisma/client";
import { CreateTenantDto, UpdateTenantDto } from "../types/tenant.dto";

const prisma = new PrismaClient();

export class TenantService {
  async createTenant(dto: CreateTenantDto) {
    return prisma.tenant.create({ data: dto });
  }
  async updateTenant(id: string, dto: UpdateTenantDto) {
    return prisma.tenant.update({ where: { id }, data: dto });
  }
  async getTenants() {
    return prisma.tenant.findMany();
  }
  async getTenantById(id: string) {
    return prisma.tenant.findUnique({ where: { id } });
  }

    async deleteTenant(id: string){
    return prisma.tenant.delete({ where: { id } });
  }

    // Get tenants with B2B connections
  async getTenantsWithB2B() {
    return prisma.tenant.findMany({
      include: {
        b2bConnectionsA: true,
        b2bConnectionsB: true
      }
    });
  }
}

export const tenantService = new TenantService();