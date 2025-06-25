import { PrismaClient } from "@prisma/client";
import { CreateCustomerDto, UpdateCustomerDto } from "../types/crm.dto";

const prisma = new PrismaClient();

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

  // Loyalty, purchase history, segmentation logic can be added here
}

export const customerService = new CustomerService();


// export class CustomerService {
  // type Customer = Awaited<ReturnType<typeof prisma.customer.create>>;
//   async createCustomer(data: Partial<Customer>): Promise<Customer> {
//     return prisma.customer.create({ data });
//   }

//   async getCustomerById(id: string): Promise<Customer | null> {
//     return prisma.customer.findUnique({ where: { id } });
//   }

//   async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
//     return prisma.customer.update({ where: { id }, data });
//   }

//   async deleteCustomer(id: string): Promise<Customer> {
//     return prisma.customer.delete({ where: { id } });
//   }

//   async listCustomersByTenant(tenantId: string): Promise<Customer[]> {
//     return prisma.customer.findMany({ where: { tenantId } });
//   }
// }
