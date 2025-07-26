import prisma from "@shared/infra/database/prisma";
import { CreateCustomerDto, TenantCustomerDto, UpdateCustomerDto } from "../types/crm.dto";
import { logger } from "@logging/logger";



export class CustomerService {
  async createCustomer(dto: CreateCustomerDto) {

    return prisma.customer.create({ data: dto });
  }
  
  async updateCustomer(id: string, dto: UpdateCustomerDto) {
    return prisma.customer.update({ where: { id }, data: dto });
  }
  
  async getCustomers(tenantId: string) {
    return prisma.customer.findMany({
      where: { tenantId },
      include: { transactions: true, payments: true, communicationLogs: true },
    });
  }
  
  async getCustomerById(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: { transactions: true, payments: true, communicationLogs: true },
    });
  }
async deleteCustomer(id: string) {
    return prisma.customer.delete({ where: { id } });
  }



  async createCustomerForTenantB(tenantA: TenantCustomerDto, tenantBId: string) {
  const exists = await prisma.customer.findFirst({
    where: {
      tenantId: tenantBId,
      linkedTenantId: tenantA.id,
    },
  });


  if (exists) {
    logger.info(`[Customer] Customer for Tenant ${tenantA.id} already exists in Tenant ${tenantBId}`);
    return exists;
  }

  return prisma.customer.create({
    data: {
      tenantId: tenantBId,
      name: tenantA.name,
      segment: 'wholesale',
      tags: ['b2b', 'octa-tenant'],
      linkedTenantId: tenantA.id,
    },
  });
}


// async createFromB2BConnection(connection, partnerTenant) {
//   return prisma.customer.upsert({
//     where: {
//       email: `${partnerTenant.name}@b2b.local`,
//     },
//     update: {},
//     create: {
//       tenantId: connection.tenantAId,
//       name: partnerTenant.name,
//       email: `${partnerTenant.name}@b2b.local`,
//       segment: 'wholesale',
//       tags: ['B2B', partnerTenant.id],
//     },
//   });
// }

  
  // Loyalty, purchase history, segmentation logic can be added here
  
}

export const customerService = new CustomerService();