import { PrismaClient } from "@prisma/client";
import { CreateTransactionDto, GetTransactionFilters, TransactionResponseDto, UpdateTransactionDto, UpdateTransactionStatusDto } from "../types/transaction.dto";
import { auditService } from "@modules/audit/services/audit.service";
import { eventBus } from "@events/eventBus";
import { EVENTS } from "@events/events";
import { paymentService } from "@modules/payments/services/payment.service";
import { cacheService } from "@cache/cache.service";
import { AppError } from "@common/constants/app.errors";

const prisma = new PrismaClient();

export class TransactionService {

    private cacheKey(tenantId: string) {
    return `transactions:${tenantId}`;
  }
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

  async list(tenantId: string): Promise<TransactionResponseDto[]> {
    const key = this.cacheKey(tenantId);
    const cached = await cacheService.get<TransactionResponseDto[]>(key);
    if (cached) return cached;

    const records = await prisma.transaction.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' },
    });
    await cacheService.set(key, records, 300);
    return records;
  }
 

  async createTransaction(tenantId: string, userId: string, dto: CreateTransactionDto): Promise<TransactionResponseDto>  {

     // 1) If it’s a PO invoice, mark the PO “invoiced” or update its balance
  if (dto.referenceType === 'purchaseOrder' && dto.referenceId) {
    await prisma.purchaseOrder.update({
      where: { id: dto.referenceId },
      data: { status: 'invoiced' }
    });
  }

  // 2) If it’s a POS transaction, mark the sale “posted”
  if (dto.referenceType === 'posTransaction' && dto.referenceId) {
    await prisma.posTransaction.update({
      where: { id: dto.referenceId },
      data: { status: 'posted' }
    });
  }

  // 3) If it’s a stock transfer, record the financial side
  if (dto.referenceType === 'stockTransfer' && dto.referenceId) {
    await prisma.stockTransfer.update({
      where: { id: dto.referenceId },
      data: { financialStatus: 'billed' }
    });
  }

  // 4) Create the transaction record
  const rec = await prisma.transaction.create({
    data: {
      tenantId,
      createdById: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...dto,
    }
  });

    // 5) If paymentStatus=’paid’, kick off a Payment record too
  if (dto.paymentStatus === 'paid') {
    await paymentService.create(
      tenantId,
      userId,
      {
        transactionId: rec.id,
        amount: rec.amount,
        method: 'internal',       // or info from metadata
        status: 'completed',
        paymentDate: new Date()
      }
    );
  }

  // 6) Audit + Event
  await auditService.log({ tenantId, userId, module:'Transaction', action:'create', entityId:rec.id, details:dto });
  eventBus.emit(EVENTS.TRANSACTION_CREATED, rec);

  return rec;
  }


  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateTransactionDto
  ): Promise<TransactionResponseDto> {
    const existing = await this.getById(tenantId, id);
    const rec = await prisma.transaction.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: { connect: { id: userId } },
      },
    });
    await cacheService.del(this.cacheKey(tenantId));
    await auditService.log({
      tenantId,
      userId,
      module: 'Transaction',
      action: 'update',
      entityId: id,
      details: dto,
    });
    eventBus.emit(EVENTS.TRANSACTION_UPDATED, rec);
    return rec;
  }

  // async updateTransactionStatus(id: string, dto: UpdateTransactionStatusDto) {
  //   return prisma.transaction.update({ where: { id }, data: { status: dto.status } });
  // }

   async getById(tenantId: string, id: string): Promise<TransactionResponseDto> {
    const rec = await prisma.transaction.findUnique({ where: { id } });
    if (!rec || rec.tenantId !== tenantId) {
      throw new AppError('Transaction not found', 404);
    }
    return rec;
  }

  //  async getTransactionById(tenantId: string, id: string) {
  //   return prisma.transaction.findFirst({
  //     where: { tenantId, id },
  //     include: { items: true, payments: true, customer: true, user: true, store: true, posSession: true },
  //   });
  // }

  async delete(tenantId: string, userId: string, id: string): Promise<void> {
    await this.getById(tenantId, id);
    await prisma.transaction.delete({ where: { id } });
    await cacheService.del(this.cacheKey(tenantId));
    await auditService.log({
      tenantId,
      userId,
      module: 'Transaction',
      action: 'delete',
      entityId: id,
      details: {},
    });
    eventBus.emit(EVENTS.TRANSACTION_DELETED, { id, tenantId });
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
