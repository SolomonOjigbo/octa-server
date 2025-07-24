import prisma from "@shared/infra/database/prisma";


type Transaction = Awaited<ReturnType<typeof prisma.transaction.create>>;

export class TransactionService {
  async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
    return prisma.transaction.create({ data });
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({ where: { id } });
  }

  async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction> {
    return prisma.transaction.update({ where: { id }, data });
  }

  async deleteTransaction(id: string): Promise<Transaction> {
    return prisma.transaction.delete({ where: { id } });
  }

  async listTransactionsByStore(storeId: string): Promise<Transaction[]> {
    return prisma.transaction.findMany({ where: { storeId } });
  }

  async listTransactionsByTenant(tenantId: string): Promise<Transaction[]> {
    return prisma.transaction.findMany({ where: { tenantId } });
  }

  async listTransactionsByCustomer(customerId: string): Promise<Transaction[]> {
    return prisma.transaction.findMany({ where: { customerId } });
  }
}
