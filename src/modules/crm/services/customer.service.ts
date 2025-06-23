import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();


type Customer = Awaited<ReturnType<typeof prisma.customer.create>>;

export class CustomerService {
  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    return prisma.customer.create({ data });
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    return prisma.customer.findUnique({ where: { id } });
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    return prisma.customer.update({ where: { id }, data });
  }

  async deleteCustomer(id: string): Promise<Customer> {
    return prisma.customer.delete({ where: { id } });
  }

  async listCustomersByTenant(tenantId: string): Promise<Customer[]> {
    return prisma.customer.findMany({ where: { tenantId } });
  }
}
