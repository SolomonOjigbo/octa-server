// modules/purchaseOrder/services/purchaseOrder.service.ts
import { auditService } from "@modules/audit/services/audit.service";
import { logger } from "@logging/logger";
import { cacheService } from "@cache/cache.service";
import { AppError } from "@common/constants/app.errors";
import { eventBus } from '@events/eventBus';
import { EVENTS } from '@events/events';
import prisma from "@shared/infra/database/prisma";
import { inventoryFlowService } from "@modules/inventory/services/inventoryFlow.service";
import { b2bConnectionService } from "@modules/b2b/services/b2bConnection.service";
import { productSupplierService } from "@modules/supplier/services/productSupplier.service";
import { supplierService } from "@modules/supplier/services/supplier.service";
import { invoiceService } from '@modules/invoice/services/invoice.service';
import {
  CreatePurchaseOrderDto,
  PurchaseOrderItemDto,
  UpdatePurchaseOrderDto,
  CancelPurchaseOrderDto,
  LinkPaymentDto,
} from '../types/purchaseOrder.dto';

export class PurchaseOrderService {
  private cacheKey(tenantId: string) {
    return `purchase_orders:${tenantId}`;
  }

  async list(tenantId: string) {
    const key = this.cacheKey(tenantId);
    const cached = await cacheService.get(key);
    if (cached) return cached;
    const rows = await prisma.purchaseOrder.findMany({
      where: { tenantId },
      include: { items: true, payments: true },
      orderBy: { orderDate: 'desc' },
    });
    await cacheService.set(key, rows, 300);
    return rows;
  }

  async getById(tenantId: string, id: string) {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: { items: true, payments: true },
    });
    if (!po) throw new AppError('Purchase Order not found', 404);
    return po;
  }

  async create(
    tenantId: string,
    userId: string,
    dto: CreatePurchaseOrderDto
  ) {
    // 1) B2B supplier check
    const supplier = await supplierService.getSupplierById(dto.supplierId);
    if (!supplier) throw new AppError('Supplier not found', 404);
    if (
      supplier.tenantId &&
      supplier.tenantId !== tenantId
    ) {
      await b2bConnectionService.ensureConnectionExists(
        tenantId,
        supplier.tenantId
      );
    }

    // 2) Materialize tenantProductId for items
    const items: Array<PurchaseOrderItemDto & { tenantProductId: string }> =
      await Promise.all(
        dto.items.map(async (it) => {
          let tpid = it.tenantProductId!;
          if (!tpid && it.globalProductId) {
            // find or create tenantProduct
            let tp = await prisma.tenantProduct.findFirst({
              where: {
                tenantId,
                globalProductId: it.globalProductId,
              },
            });
            if (!tp) {
              tp = await prisma.tenantProduct.create({
                data: {
                  tenantId,
                  globalProductId: it.globalProductId,
                  isTransferable: true,
                },
              });
            }
            tpid = tp.id;
          }
          return { ...it, tenantProductId: tpid };
        })
      );

    // 3) Auto‐link ProductSupplier
    for (const it of items) {
      await productSupplierService.linkProductToSupplier(tenantId, {
        supplierId: dto.supplierId,
        tenantProductId: it.tenantProductId,
        // price/leadTime optional
      });
    }

    // 4) Create the PO + items
    const po = await prisma.purchaseOrder.create({
      data: {
        tenant: {connect: {id: tenantId}},
        supplier: {connect: {id: dto.supplierId}},
        status: dto.status,
        store: {connect: {id: dto.storeId }},
        orderDate: dto.orderDate,
        receivedDate: dto.receivedDate ?? null,
        totalAmount: dto.totalAmount,
        notes: dto.notes ?? undefined,
        createdBy: {connect: {id:userId}},
        items: {
          createMany: {
            data: items.map((it) => ({
              tenantProductId: it.tenantProductId,
              tenantProductVariantId: it.tenantProductVariantId ?? null,
              quantity: it.quantity,
              costPrice: it.costPrice,
              batchNumber: it.batchNumber ?? null,
              expiryDate: it.expiryDate ?? null,
            })),
          },
        },
      },
      include: { items: true },
    });

    // 5) Clear cache & audit & events
    await cacheService.del(this.cacheKey(tenantId));
    await auditService.log({
      tenantId,
      userId,
      module: 'PurchaseOrder',
      action: 'create',
      entityId: po.id,
      details: dto,
    });
    eventBus.emit(EVENTS.PURCHASE_ORDER_CREATED, po);

    // 6) Auto‐create draft invoice
    const invoice = await invoiceService.createInvoiceFromPO(po, userId);
    eventBus.emit(EVENTS.INVOICE_CREATED, invoice);

    return po;
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdatePurchaseOrderDto
  ) {
    const existing = await this.getById(tenantId, id);
    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: dto.status ?? existing.status,
        receivedDate: dto.receivedDate ?? existing.receivedDate,
        notes: dto.notes ?? existing.notes,
        updatedById: userId,
      },
      include: { items: true, payments: true },
    });
    await cacheService.del(this.cacheKey(tenantId));
    await auditService.log({
      tenantId,
      userId,
      module: 'PurchaseOrder',
      action: 'update',
      entityId: id,
      details: dto,
    });
    eventBus.emit(EVENTS.PURCHASE_ORDER_UPDATED, po);
    return po;
  }

  async markAsReceived(
    tenantId: string,
    userId: string,
    id: string
  ) {
    return prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!po || po.tenantId !== tenantId)
        throw new AppError('Not found or access denied', 404);
      if (po.status === 'received')
        throw new AppError('Already received', 400);

      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: { status: 'received', receivedDate: new Date() },
      });

      // inventory receipt
      for (const it of po.items) {
        await inventoryFlowService.recordPurchaseOrderReceipt({
          tenantId,
          userId,
          storeId: po.storeId,
          warehouseId: po.warehouseId,
          purchaseOrderId: id,
          tenantProductId: it.tenantProductId,
          tenantProductVariantId: it.tenantProductVariantId ?? undefined,
          quantity: it.quantity,
          costPrice: it.costPrice,
          batchNumber: it.batchNumber,
          expiryDate: it.expiryDate,
          movementType: 'receipt',
          reference: id,
        });
      }

      await cacheService.del(this.cacheKey(tenantId));
      eventBus.emit(EVENTS.PURCHASE_ORDER_RECEIVED, updated);
      return updated;
    });
  }

  async cancel(
    tenantId: string,
    userId: string,
    id: string,
    dto: CancelPurchaseOrderDto
  ) {
    const existing = await this.getById(tenantId, id);
    if (existing.status === 'cancelled')
      throw new AppError('Already cancelled', 400);

    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'cancelled',
        notes: dto.reason ?? existing.notes,
        updatedById: userId,
      },
      include: { items: true, payments: true },
    });
    await cacheService.del(this.cacheKey(tenantId));
    await auditService.log({
      tenantId,
      userId,
      module: 'PurchaseOrder',
      action: 'cancel',
      entityId: id,
      details: dto,
    });
    eventBus.emit(EVENTS.PURCHASE_ORDER_CANCELLED, po);
    return po;
  }

  async linkPayment(
    tenantId: string,
    userId: string,
    id: string,
    dto: LinkPaymentDto
  ) {
    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        Payment: {
          create: {
            tenantId: tenantId,
            method: dto.paymentMethod,
            id: dto.paymentId,
            amount: dto.amount,
            status: dto.status
            // createdBy: { connect: { id: userId } },
          },
        },
        updatedById: userId,
      },
      include: { items: true, payments: true },
    });
    await cacheService.del(this.cacheKey(tenantId));
    await auditService.log({
      tenantId,
      userId,
      module: 'PurchaseOrder',
      action: 'linkPayment',
      entityId: id,
      details: dto,
    });
    eventBus.emit(EVENTS.PURCHASE_ORDER_PAYMENT_LINKED, po);
    return po;
  }
}

export const purchaseOrderService =
  new PurchaseOrderService();
