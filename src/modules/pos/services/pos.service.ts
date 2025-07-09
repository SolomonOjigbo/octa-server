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
} from '../types/pos.dto';
import { cacheService } from '@cache/cache.service';
import { auditService } from '@modules/audit/services/audit.service';
import { eventBus } from '@events/eventBus';
import { EVENTS } from '@events/events';
import { stockService } from '@modules/stock/services/stock.service';
import { AppError } from '@common/constants/app.errors';
import prisma from '@shared/infra/database/prisma';

export class POSService {
  private sessionKey(tenantId: string) {
    return `pos_sessions:${tenantId}`;
  }

  async openSession(tenantId: string, userId: string) {
    const session = await prisma.posSession.create({
      data: { tenantId, openedBy: userId },
    });
    await cacheService.del(this.sessionKey(tenantId));
    await auditService.log({ tenantId, userId, module:'POS', action:'openSession', entityId:session.id, details:{} });
    eventBus.emit(EVENTS.POS_SESSION_OPENED, session);
    return session;
  }

  async closeSession(tenantId: string, userId: string, sessionId: string, dto: CloseSessionDto) {
    const session = await prisma.posSession.update({
      where: { id: sessionId },
      data: { closingCash: dto.closingCash, notes: dto.notes, closedBy: userId, closedAt: new Date() },
    });
    await cacheService.del(this.sessionKey(tenantId));
    await auditService.log({ tenantId, userId, module:'POS', action:'closeSession', entityId:sessionId, details: dto });
    eventBus.emit(EVENTS.POS_SESSION_CLOSED, session);
    return session;
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

  async createTransaction(tenantId: string, userId: string, dto: CreateTransactionDto) {
    const tx = await prisma.posTransaction.create({
      data: {
        tenantId,
        sessionId: dto.sessionId,
        customerId: dto.customerId,
        createdBy: { connect: { id: userId } },
        items: {
          create: dto.items.map(i=>({
            tenantProductId:           i.tenantProductId,
            tenantProductVariantId:    i.tenantProductVariantId,
            quantity:                  i.quantity,
            unitPrice:                 i.unitPrice,
            discount:                  i.discount,
            tax:                       i.tax,
          })),
        },
        totalAmount: dto.items.reduce((sum,i)=> sum + (i.unitPrice * i.quantity) - (i.discount||0) + (i.tax||0), 0)
      },
      include: { items:true }
    });

    // adjust inventory
    for (const item of dto.items) {
      await stockService.incrementStock(tenantId, userId, {
        tenantProductId:        item.tenantProductId,
        tenantProductVariantId: item.tenantProductVariantId,
        quantity:               -item.quantity,
      });
    }

    await auditService.log({ tenantId, userId, module:'POS', action:'createTransaction', entityId:tx.id, details: dto });
    eventBus.emit(EVENTS.POS_TRANSACTION_CREATED, tx);
    return tx;
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

  async createSalesReturn(tenantId: string, userId: string, dto: CreateSalesReturnDto) {
    const ret = await prisma.posSalesReturn.create({
      data: {
        tenantId,
        transaction: { connect:{ id:dto.transactionId } },
        createdBy: { connect:{ id:userId } },
        items: {
          create: dto.items.map(i=>({
            tenantProductId:         i.tenantProductId,
            tenantProductVariantId:  i.tenantProductVariantId,
            quantity:                i.quantity,
            reason:                  i.reason
          })),
        }
      },
      include:{ items:true }
    });
    // restock inventory
    for (const item of dto.items) {
      await stockService.incrementStock(tenantId, userId, {
        tenantProductId:        item.tenantProductId,
        tenantProductVariantId: item.tenantProductVariantId,
        quantity:               item.quantity,
      });
    }
    await auditService.log({ tenantId, userId, module:'POS', action:'createSalesReturn', entityId:ret.id, details: dto });
    eventBus.emit(EVENTS.POS_SALES_RETURN_CREATED, ret);
    return ret;
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
