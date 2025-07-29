import prisma from "@shared/infra/database/prisma";
import { CreateTransactionDto, GetTransactionFilters, TransactionResponseDto, TransactionStatus, UpdateTransactionDto} from "../types/transaction.dto";
import { auditService } from "@modules/audit/services/audit.service";
import { eventBus } from "@events/eventBus";
import { EVENTS } from "@events/events";
import { paymentService } from "@modules/payments/services/payment.service";
import { cacheService } from "@cache/cache.service";
import { AppError } from "@common/constants/app.errors";
import { PaymentStatus } from "@prisma/client";



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
      include: { items: true, payments: true, customer: true, store: true, posSession: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async list(tenantId: string): Promise<TransactionResponseDto[]> {
    const key = this.cacheKey(tenantId);
    const cached = await cacheService.get<TransactionResponseDto[]>(key);
    if (cached) return cached;
  
    const records = await prisma.transaction.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    await cacheService.set(key, records, 300);
    return records as TransactionResponseDto[];
  }
 

  async createTransaction(tenantId: string, userId: string, dto: CreateTransactionDto) {

     // 1) If it’s a PO invoice, mark the PO “invoiced” or update its balance
  if (dto.referenceType === 'PURCHASE_ORDER' && dto.referenceId) {
    await prisma.purchaseOrder.update({
      where: { id: dto.referenceId },
      data: { status: 'invoiced' }
    });
  }

  // 2) If it’s a POS transaction, mark the sale “posted”
  if (dto.referenceType === 'POS_TRANSACTION' && dto.referenceId) {
    await prisma.transaction.update({
      where: { id: dto.referenceId },
      data: { status: 'COMPLETED' }
    });
  }

  // 3) If it’s a stock transfer, record the financial side
  if (dto.referenceType === 'STOCK_TRANSFER' && dto.referenceId) {
    await prisma.stockTransfer.update({
      where: { id: dto.referenceId },
      data: { status: 'PENDING' }
    });
  }

  // 4) Create the transaction record
  const rec = await prisma.transaction.create({
     data: {
        tenant: { connect: { id: tenantId } },
        store:       dto.storeId     ? { connect: { id: dto.storeId     } } : undefined,
        warehouse:   dto.warehouseId ? { connect: { id: dto.warehouseId } } : undefined,
        createdBy:   { connect: { id: userId } },
        customer:      dto.customerId  ? { connect: { id: dto.customerId  } } : undefined,
        amount:        dto.amount,
        discount:      dto.discount,
        taxAmount:     dto.taxAmount,
        referenceType: dto.referenceType,
        referenceId:   dto.referenceId,
        shippingFee:   dto.shippingFee,
        shippingType:  dto.shippingType,
        shippingAddress:dto.shippingAddress,
        metadata:      dto.metadata,
        paymentMethod: dto.paymentMethod,
        paymentStatus: dto.paymentStatus,
        status:        "POSTED",
        posSession:    dto.posSessionId ? { connect:{ id:dto.posSessionId }} : undefined,
      }
  });

    // 5) If paymentStatus=’paid’, kick off a Payment record too
  if (dto.paymentStatus === 'PAID') {
    await paymentService.create(
      tenantId,
      userId,
      {
        transactionId: rec.id,
        amount: rec.amount,
        method: 'internal',       // or info from metadata
        status: PaymentStatus.PAID,
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
  ) {
    const existing = await this.getById(tenantId, id);
    if (!existing) {
      throw new AppError('Transaction not found', 404);
    }
    const rec = await prisma.transaction.update({
      where: { id },
      data: {
        ...dto,
        storeId: dto.storeId,
        status: dto.status,
        paymentMethod: dto.paymentMethod,
        updatedById: userId,
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

   async getById(tenantId: string, id: string){
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