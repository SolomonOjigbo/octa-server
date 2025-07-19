// src/modules/pos/services/pos.service.ts

import {
  CreateTransactionDto,
  CreatePaymentDto,
  CreateSalesReturnDto,
  CreateCashDropDto,
  ReconcileCashDto,
  POSSessionSummary,
  POSReceipt,
  CloseSessionDto,
  OpenSessionDto,
} from '../types/pos.dto';
import { cacheService } from '@cache/cache.service';
import { auditService } from '@modules/audit/services/audit.service';
import { eventBus } from '@events/eventBus';
import { EVENTS } from '@events/events';
import { stockService } from '@modules/stock/services/stock.service';
import { AppError } from '@common/constants/app.errors';
import prisma from '@shared/infra/database/prisma';
import { inventoryFlowService } from '@modules/inventory/services/inventoryFlow.service';
import { v4 as uuid } from 'uuid';

export class POSService {
  private sessionKey(tenantId: string) {
    return `pos_sessions:${tenantId}`;
  }

  async createPOSSession(
  tenantId: string,
  userId: string,
  dto: OpenSessionDto
) {
  const session = await prisma.pOSSession.create({
    data: {
      tenantId,
      storeId: dto.storeId,
      userId,
      openedBy: userId,
      openingBalance: dto.openingBalance,
      notes: dto.notes ?? null,
    },
  });

  await auditService.log({
    tenantId,
    userId,
    module: 'POS',
    action: 'open-session',
    entityId: session.id,
    details: {
      storeId: dto.storeId,
      openingBalance: dto.openingBalance,
      notes: dto.notes,
    },
  });

  eventBus.emit(EVENTS.POS_SESSION_OPENED, {
    tenantId,
    sessionId: session.id,
    userId,
  });

  return session;
}

  async closePOSSession(
  tenantId: string,
  dto: CloseSessionDto
) {
  const session = await prisma.pOSSession.findFirst({
    where: { id: dto.sessionId, tenantId, isOpen: true },
  });

  if (!session) {
    throw new Error("No active session found.");
  }

  const closed = await prisma.pOSSession.update({
    where: { id: session.id },
    data: {
      closingBalance: dto.closingBalance,
      closedAt: new Date(),
      closedBy: dto.closedBy,
      isOpen: false,
      notes: dto.notes ?? session.notes,
    },
  });

  await auditService.log({
    tenantId,
    userId: dto.closedBy,
    module: 'pos',
    action: 'close-session',
    entityId: session.id,
    details: {
      closingBalance: dto.closingBalance,
      notes: dto.notes,
    },
  });

  eventBus.emit(EVENTS.POS_SESSION_CLOSED, {
    tenantId,
    sessionId: session.id,
    userId: dto?.closedBy,
  });

  return closed;
}


  async getSessionSummary(tenantId: string, sessionId: string): Promise<POSSessionSummary> {
    const session = await prisma.posSession.findFirst({
      where: { id: sessionId, tenantId },
      include: { transactions:true, payments:true, salesReturns:true, cashDrops:true, reconciliations:true },
    });
    if (!session) throw new AppError('Session not found',404);

    const totalSales      = session.transactions.reduce((s,t)=>s + (t.totalAmount||0), 0);
    const totalPayments   = session.payments.reduce((s,p)=>s + p.amount,0);
    const totalReturns    = session.salesReturns.reduce((s,r)=>s + (r.refundAmount||0),0);
    const totalCashDrops  = session.cashDrops.reduce((s,c)=>s + c.amount,0);
    const totalReconciled = session.reconciliations.reduce((s,r)=>s + r.countedCashAmount,0);

    return {
      sessionId,
      openedBy: session.openedBy,
      openedAt: session.openedAt,
      closedAt: session.closedAt || undefined,
      totalSales, totalPayments, totalReturns, totalCashDrops, totalReconciled
    };
  }

 async createTransaction(
  tenantId: string,
  userId: string,
  dto: CreateTransactionDto
) {
  return prisma.$transaction(async (tx) => {
    // 1. Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        total: dto.total,
        paymentMethod: dto.paymentMethod,
        reference: dto.reference || uuid(),
        posSessionId: dto.sessionId,
        createdById: userId,
        items: {
          create: dto.items.map((item) => ({
            tenantProductId: item.tenantProductId,
            tenantProductVariantId: item.tenantProductVariantId,
            quantity: item.quantity,
            price: item.unitPrice,
            discount: item.discount,
            tax: item.tax,
          })),
        },
      },
    });

    // 2. Inventory + stock adjustment
    await inventoryFlowService.processPOSale(
      tenantId,
      userId,
      dto.items.map((item) => ({
        tenantProductId: item.tenantProductId,
        tenantProductVariantId: item.tenantProductVariantId,
        quantity: item.quantity,
        storeId: item.storeId,
        reference: transaction.id,
        metadata: {
          paymentMethod: dto.paymentMethod,
          unitPrice: item.unitPrice,
          discount: item.discount,
          tax: item.tax,
          sessionId: dto.sessionId,
        },
      }))
    );
    await auditService.log({ tenantId, userId, module:'POS', action:'createTransaction', entityId:tx.id, details: dto });

    // 3. Emit event
    eventBus.emit(EVENTS.POS_ORDER_CREATED, {
      tenantId,
      orderId: transaction.id,
    });
    eventBus.emit(EVENTS.POS_TRANSACTION_CREATED, transaction);
    return transaction;
  });
}

  async createPayment(tenantId: string, userId: string, dto: CreatePaymentDto) {
    const payment = await prisma.posPayment.create({
      data: {
        tenantId,
        transaction: { connect:{ id: dto.transactionId } },
        amount: dto.amount,
        method: dto.method,
        reference: dto.reference,
        createdBy: { connect:{ id:userId } }
      }
    });
    await auditService.log({ tenantId, userId, module:'POS', action:'createPayment', entityId:payment.id, details: dto });
    eventBus.emit(EVENTS.POS_PAYMENT_CREATED, payment);
    return payment;
  }

  // async createSalesReturn(tenantId: string, userId: string, dto: CreateTransactionDto) {
  //   const ret = await prisma.posSalesReturn.create({
  //     data: {
  //       tenantId,
  //       transaction: { connect:{ id:dto.transactionId } },
  //       createdBy: { connect:{ id:userId } },
  //       items: {
  //         create: dto.items.map(i=>({
  //           tenantProductId:         i.tenantProductId,
  //           tenantProductVariantId:  i.tenantProductVariantId,
  //           quantity:                i.quantity,
  //           reason:                  i.reason
  //         })),
  //       }
  //     },
  //     include:{ items:true }
  //   });
  //   // restock inventory
  //   for (const item of dto.items) {
  //     await stockService.incrementStock(tenantId, userId, {
  //       tenantProductId:        item.tenantProductId,
  //       tenantProductVariantId: item.tenantProductVariantId,
  //       quantity:               item.quantity,
  //     });
  //   }
  //   eventBus.emit(EVENTS.POS_SALES_RETURN_CREATED, ret);
  //   return ret;
  // }
  async createSalesReturn(
  tenantId: string,
  userId: string,
  dto: CreateTransactionDto
) {
  return prisma.$transaction(async (tx) => {
    const returnTxn = await tx.transaction.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        total: dto.total,
        paymentMethod: dto.paymentMethod,
        reference: `RETURN-${dto.reference ?? Date.now()}`,
        posSessionId: dto.sessionId,
        createdById: userId,
        isReturn: true,
        items: {
          create: dto.items.map((item) => ({
            tenantProductId: item.tenantProductId,
            tenantProductVariantId: item.tenantProductVariantId,
            quantity: item.quantity,
            price: item.unitPrice,
            discount: item.discount,
            tax: item.tax,
          })),
        },
      },
    });

    await inventoryFlowService.processPOSReturn(
      tenantId,
      userId,
      dto.items.map((item) => ({
        tenantProductId: item.tenantProductId,
        tenantProductVariantId: item.tenantProductVariantId,
        quantity: item.quantity,
        storeId: item.storeId,
        reference: returnTxn.id,
        metadata: {
          returnFrom: dto.reference,
          sessionId: dto.sessionId,
          unitPrice: item.unitPrice,
        },
      }))
    );
    await auditService.log({ tenantId, userId, module:'POS', action:'createSalesReturn', entityId: returnTxn.id, details: dto });
    eventBus.emit(EVENTS.POS_RETURN_CREATED, {
      tenantId,
      orderId: returnTxn.id,
    });

    return returnTxn;
  });
}


  async createCashDrop(tenantId: string, userId: string, dto: CreateCashDropDto) {
    const drop = await prisma.posCashDrop.create({
      data: {
        tenantId,
        session: { connect:{ id:dto.sessionId } },
        amount: dto.amount,
        reason: dto.reason,
        createdBy: { connect:{ id:userId } }
      }
    });
    await auditService.log({ tenantId, userId, module:'POS', action:'createCashDrop', entityId:drop.id, details: dto });
    eventBus.emit(EVENTS.POS_CASH_DROP_CREATED, drop);
    return drop;
  }

  async reconcileCash(tenantId: string, userId: string, dto: ReconcileCashDto) {
    const rec = await prisma.posReconciliation.create({
      data: {
        tenantId,
        session: { connect:{ id:dto.sessionId } },
        countedCashAmount: dto.countedCashAmount,
        varianceReason:    dto.varianceReason,
        createdBy: { connect:{ id:userId } }
      }
    });
    await auditService.log({ tenantId, userId, module:'POS', action:'reconcileCash', entityId:rec.id, details: dto });
    eventBus.emit(EVENTS.POS_RECONCILIATION_CREATED, rec);
    return rec;
  }
}
export const posService = new POSService();
