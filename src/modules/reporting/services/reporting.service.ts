
import { SalesBucket, InventoryStatus, POStatusCount, TransactionTypeCount, PaymentMethodCount, B2BStatusCount } from '../types/reporting.dto';
import { cacheService } from '@cache/cache.service';
import { auditService } from '@modules/audit/services/audit.service';
import { eventBus } from '@events/eventBus';
import { EVENTS } from '@events/events';
import prisma from '@shared/infra/database/prisma';

export class ReportingService {
  private salesKey(tid:string, grp:string)   { return `reports:sales:${tid}:${grp}` }
  private invKey(tid:string, br:boolean)     { return `reports:inventory:${tid}:${br}` }
  private poKey(tid:string)                  { return `reports:po:${tid}` }
  private txKey(tid:string)                  { return `reports:tx:${tid}` }
  private payKey(tid:string)                 { return `reports:payments:${tid}` }
  private b2bKey(tid:string)                 { return `reports:b2b:${tid}` }

  async salesSummary(tenantId:string, startDate?:Date, endDate?:Date, groupBy='day'): Promise<SalesBucket[]> {
    const key = this.salesKey(tenantId, groupBy);
    const cached = await cacheService.get<SalesBucket[]>(key);
    if (cached) return cached;

    const where: any = { tenantId };
    if (startDate) where.createdAt = { gte: startDate };
    if (endDate)   where.createdAt = { ...(where.createdAt||{}), lte: endDate };

    const buckets = await prisma.posTransaction.groupBy({
      by: [ `createdAt${groupBy === 'day' ? 'Date' : groupBy === 'week' ? 'Week' : 'Month'}` as any ],
      where,
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    const result: SalesBucket[] = buckets.map(b => ({
      period:       (b as any)[ `createdAt${groupBy === 'day' ? 'Date' : groupBy === 'week' ? 'Week' : 'Month'}` ].toString(),
      totalSales:   b._sum.totalAmount || 0,
      count:        b._count.id,
    }));

    await cacheService.set(key, result, 300);
    await auditService.log({ tenantId, userId: 'system', module:'Reporting', action:'salesSummary', entityId:key, details:{startDate,endDate,groupBy} });
    eventBus.emit(EVENTS.REPORT_GENERATED, { tenantId, report:'salesSummary' });
    return result;
  }

  async inventoryStatus(tenantId:string, belowReorder:boolean): Promise<InventoryStatus[]> {
    const key = this.invKey(tenantId, belowReorder);
    const cached = await cacheService.get<InventoryStatus[]>(key);
    if (cached) return cached;

    const where: any = { tenantId };
    if (belowReorder) {
      where.quantity = { lte: prisma.raw('reorder_point') };
    }

    const rows = await prisma.stock.findMany({
      where,
      include: { tenantProduct: { select:{ id:true, name:true } } },
    });

    const result: InventoryStatus[] = rows.map(r => ({
      tenantProductId: r.tenantProductId,
      productName:     r.tenantProduct.name,
      quantity:        r.quantity,
      reorderPoint:    r.reorderPoint ?? undefined,
    }));

    await cacheService.set(key, result, 300);
    await auditService.log({ tenantId, userId:'system', module:'Reporting', action:'inventoryStatus', entityId:key, details:{belowReorder} });
    eventBus.emit(EVENTS.REPORT_GENERATED, { tenantId, report:'inventoryStatus' });
    return result;
  }

  async purchaseOrderStatus(tenantId:string): Promise<POStatusCount[]> {
    const key = this.poKey(tenantId);
    const cached = await cacheService.get<POStatusCount[]>(key);
    if (cached) return cached;

    const buckets = await prisma.purchaseOrder.groupBy({
      by:['status'],
      where:{ tenantId },
      _count:{ id:true },
    });

    const result: POStatusCount[] = buckets.map(b => ({
      status: b.status,
      count:  b._count.id,
    }));

    await cacheService.set(key, result, 300);
    await auditService.log({ tenantId, userId:'system', module:'Reporting', action:'purchaseOrderStatus', entityId:key, details:{} });
    eventBus.emit(EVENTS.REPORT_GENERATED, { tenantId, report:'purchaseOrderStatus' });
    return result;
  }

  async transactionTypes(tenantId:string): Promise<TransactionTypeCount[]> {
    const key = this.txKey(tenantId);
    const cached = await cacheService.get<TransactionTypeCount[]>(key);
    if (cached) return cached;

    const buckets = await prisma.transaction.groupBy({
      by:['type'],
      where:{ tenantId },
      _sum:{ amount:true },
      _count:{ id:true },
    });

    const result: TransactionTypeCount[] = buckets.map(b => ({
      type:        b.type,
      totalAmount: b._sum.amount || 0,
      count:       b._count.id,
    }));

    await cacheService.set(key, result, 300);
    await auditService.log({ tenantId, userId:'system', module:'Reporting', action:'transactionTypes', entityId:key, details:{} });
    eventBus.emit(EVENTS.REPORT_GENERATED, { tenantId, report:'transactionTypes' });
    return result;
  }

  async paymentMethods(tenantId:string): Promise<PaymentMethodCount[]> {
    const key = this.payKey(tenantId);
    const cached = await cacheService.get<PaymentMethodCount[]>(key);
    if (cached) return cached;

    const buckets = await prisma.payment.groupBy({
      by:['method'],
      where:{ tenantId },
      _sum:{ amount:true },
      _count:{ id:true },
    });

    const result: PaymentMethodCount[] = buckets.map(b => ({
      method:      b.method,
      totalAmount: b._sum.amount || 0,
      count:       b._count.id,
    }));

    await cacheService.set(key, result, 300);
    await auditService.log({ tenantId, userId:'system', module:'Reporting', action:'paymentMethods', entityId:key, details:{} });
    eventBus.emit(EVENTS.REPORT_GENERATED, { tenantId, report:'paymentMethods' });
    return result;
  }

  async b2bConnections(tenantId:string): Promise<B2BStatusCount[]> {
    const key = this.b2bKey(tenantId);
    const cached = await cacheService.get<B2BStatusCount[]>(key);
    if (cached) return cached;

    const buckets = await prisma.b2BConnection.groupBy({
      by:['status'],
      where:{ OR:[{ tenantAId:tenantId },{ tenantBId:tenantId }] },
      _count:{ id:true },
    });

    const result: B2BStatusCount[] = buckets.map(b => ({
      status: b.status,
      count:  b._count.id,
    }));

    await cacheService.set(key, result, 300);
    await auditService.log({ tenantId, userId:'system', module:'Reporting', action:'b2bConnections', entityId:key, details:{} });
    eventBus.emit(EVENTS.REPORT_GENERATED, { tenantId, report:'b2bConnections' });
    return result;
  }
}

export const reportingService = new ReportingService();
