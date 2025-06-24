import { PrismaClient } from "@prisma/client";
import { GetTransactionFilters, UpdateTransactionStatusDto } from "../types/transaction.dto";

const prisma = new PrismaClient();

export class TransactionService {
  async getTransactions(filters: GetTransactionFilters) {
    // Filter by tenantId, storeId, customerId, status, sessionId, date range, etc.
    const where: any = { tenantId: filters.tenantId };
    if (filters.storeId) where.storeId = filters.storeId;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.sessionId) where.sessionId = filters.sessionId;
    if (filters.status) where.status = filters.status;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }
    return prisma.transaction.findMany({
      where,
      include: { items: true, payments: true, customer: true, user: true, store: true, posSession: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getTransactionById(tenantId: string, id: string) {
    return prisma.transaction.findFirst({
      where: { tenantId, id },
      include: { items: true, payments: true, customer: true, user: true, store: true, posSession: true },
    });
  }

  async createTransaction(data: any) {
    return prisma.transaction.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: { items: true, payments: true, customer: true, user: true, store: true, posSession: true },
    });
  }

  async updateTransactionStatus(id: string, dto: UpdateTransactionStatusDto) {
    return prisma.transaction.update({ where: { id }, data: { status: dto.status } });
  }
}

export const transactionService = new TransactionService();



















// type Transaction = Awaited<ReturnType<typeof prisma.transaction.create>>;

// export class TransactionService {
//   async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
//     return prisma.transaction.create({ data });
//   }

//   async getTransactionById(id: string): Promise<Transaction | null> {
//     return prisma.transaction.findUnique({ where: { id } });
//   }

//   async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction> {
//     return prisma.transaction.update({ where: { id }, data });
//   }

//   async deleteTransaction(id: string): Promise<Transaction> {
//     return prisma.transaction.delete({ where: { id } });
//   }

//   async listTransactionsByStore(storeId: string): Promise<Transaction[]> {
//     return prisma.transaction.findMany({ where: { storeId } });
//   }

//   async listTransactionsByTenant(tenantId: string): Promise<Transaction[]> {
//     return prisma.transaction.findMany({ where: { tenantId } });
//   }

//   async listTransactionsByCustomer(customerId: string): Promise<Transaction[]> {
//     return prisma.transaction.findMany({ where: { customerId } });
//   }
// }
