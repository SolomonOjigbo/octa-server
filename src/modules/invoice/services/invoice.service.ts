// src/modules/invoice/services/invoice.service.ts
import {
  CreateInvoiceDto,
  IssueInvoiceDto,
  UpdateInvoiceDto,
  ApplyPaymentDto,
  InvoiceResponseDto,
  InvoiceDetailDto,
  CreateInvoicePaymentDto,
} from '../types/invoice.dto';
import { cacheService } from '@cache/cache.service';
import { auditService } from '@modules/audit/services/audit.service';
import { eventBus } from '@events/eventBus';
import { EVENTS } from '@events/events';
import { transactionService } from '@modules/transactions/services/transaction.service';
import { paymentService }     from '@modules/payments/services/payment.service';
import prisma from '@shared/infra/database/prisma';
import { AppError } from '@common/constants/app.errors';

export class InvoiceService {
  private listKey(tid: string) { return `invoices:${tid}`; }

  async list(
    tenantId: string,
    filters: {
      status?: string;
      referenceType?: string;
      referenceId?: string;
      customerId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ) {
    const key = this.listKey(tenantId);
    const cached = await cacheService.get(key);
    if (cached) return cached;

    const {
      status, referenceType, referenceId,
      customerId, startDate, endDate, page=1, limit=20
    } = filters;

    const where: any = { tenantId };
    if (status)        where.status = status;
    if (referenceType) where.referenceType = referenceType;
    if (referenceId)   where.referenceId = referenceId;
    if (customerId)    where.customerId = customerId;
    if (startDate)     where.issueDate = { gte: startDate };
    if (endDate)       where.issueDate = { ...(where.issueDate||{}), lte: endDate };

    const data = await prisma.invoice.findMany({
      where,
      skip: (page-1)*limit,
      take: limit,
      orderBy: { issueDate: 'desc' },
    });
    await cacheService.set(key, data, 300);
    return data;
  }

  async getById(tenantId: string, id: string): Promise<InvoiceDetailDto> {
    const inv = await prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        items: true,
        payments: { select: { id:true, amount:true, method:true, paidAt:true } },
      },
    });
    if (!inv) throw new AppError('Invoice not found', 404);

    // map
    const items = inv.items.map(i => ({
      productId:   i.productId,
      variantId:   i.variantId || undefined,
      description: i.description,
      quantity:    i.quantity,
      unitPrice:   i.unitPrice,
      taxAmount:   i.taxAmount,
      lineTotal:   i.lineTotal,
    }));
    const payments = inv.payments;

    return {
      id: inv.id,
      tenantId: inv.tenantId,
      referenceType: inv.referenceType as any,
      referenceId: inv.referenceId || undefined,
      customerId: inv.customerId || undefined,
      invoiceNo: inv.invoiceNo || undefined,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate || undefined,
      status: inv.status as any,
      currency: inv.currency,
      subTotal: inv.subTotal,
      taxTotal: inv.taxTotal,
      totalAmount: inv.totalAmount,
      paymentStatus: inv.paymentStatus as any,
      metadata: inv.metadata || undefined,
      createdById: inv.createdById || undefined,
      updatedById: inv.updatedById || undefined,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
      items, payments,
    };
  }

  // invoice.service.ts

  async getInvoiceById(invoiceId: string, tenantId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      customer: true,
      issuedBy: { select: { id: true, name: true, email: true } },
      tenant: { select: { id: true, name: true } },
    },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // 👥 B2B metadata if applicable
  let b2bMeta = null;
  if (invoice.customer?.tenantId && invoice.customer.tenantId !== tenantId) {
    b2bMeta = await prisma.b2BConnection.findFirst({
      where: {
        OR: [
          { tenantAId: tenantId, tenantBId: invoice.customer.tenantId },
          { tenantAId: invoice.customer.tenantId, tenantBId: tenantId },
        ],
        status: 'approved',
      },
    });
  }

  return { ...invoice, b2bConnection: b2bMeta };
}


  async createDraft(
    tenantId: string,
    userId: string,
    dto: CreateInvoiceDto
  ): Promise<InvoiceResponseDto> {
    // link domain: update PO or POS or StockTransfer status
    if (dto.referenceType === 'purchaseOrder' && dto.referenceId) {
      await prisma.purchaseOrder.update({
        where:{ id: dto.referenceId },
        data:{ status: 'invoiced' }
      });
    }
    if (dto.referenceType === 'posTransaction' && dto.referenceId) {
      await prisma.posTransaction.update({
        where:{ id: dto.referenceId },
        data:{ status:'posted' }
      });
    }
    if (dto.referenceType === 'stockTransfer' && dto.referenceId) {
      await prisma.stockTransfer.update({
        where:{ id: dto.referenceId },
        data:{ status:'cancelled' }  // or another financial flag
      });
    }

    // compute totals
    const subTotal = dto.items.reduce((s,i)=>s + i.unitPrice * i.quantity, 0);
    const taxTotal = dto.items.reduce((s,i)=>s + i.taxAmount, 0);
    const totalAmount = subTotal + taxTotal;

    const inv = await prisma.invoice.create({
      data: {
        tenantId,
        createdById: userId,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        customerId: dto.customerId,
        dueDate: dto.dueDate,
        currency: dto.currency || 'USD',
        subTotal, taxTotal, totalAmount,
        status: 'draft',
        paymentStatus: 'unpaid',
        metadata: dto.metadata,
        items: {
          create: dto.items.map(i=>({
            productId:   i.productId,
            variantId:   i.variantId,
            description: i.description,
            quantity:    i.quantity,
            unitPrice:   i.unitPrice,
            taxAmount:   i.taxAmount,
            lineTotal:   i.unitPrice * i.quantity + i.taxAmount,
          }))
        }
      }
    });

    await cacheService.del(this.listKey(tenantId));
    await auditService.log({
      tenantId, userId,
      module: 'Invoice',
      action: 'create',
      entityId: inv.id,
      details: dto,
    });
    eventBus.emit(EVENTS.INVOICE_CREATED, inv);

    return this.getById(tenantId, inv.id);
  }

  async issue(
    tenantId: string,
    userId: string,
    id: string,
    dto: IssueInvoiceDto
  ): Promise<InvoiceResponseDto> {
    const existing = await prisma.invoice.findFirst({ where:{ id, tenantId } });
    if (!existing) throw new AppError('Invoice not found', 404);
    if (existing.status !== 'draft') throw new AppError('Only draft can be issued', 400);

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        invoiceNo: dto.invoiceNo,
        dueDate: dto.dueDate || existing.dueDate,
        status: 'issued',
        issueDate: new Date(),
      }
    });

    // create a receivable transaction
    await transactionService.createTransaction(tenantId, userId, {
      referenceType: 'invoice',
      referenceId: updated.id,
      amount: updated.totalAmount,
      date: updated.issueDate,
      status: 'pending',
      paymentStatus: 'unpaid',
      metadata: {},
    });

    await cacheService.del(this.listKey(tenantId));
    await auditService.log({
      tenantId, userId,
      module: 'Invoice',
      action: 'issue',
      entityId: id,
      details: dto,
    });
    eventBus.emit(EVENTS.INVOICE_ISSUED, updated);

    return this.getById(tenantId, id);
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateInvoiceDto
  ): Promise<InvoiceResponseDto> {
    const updated = await prisma.invoice.update({
      where: { id },
      data: { ...dto, updatedById: userId }
    });
    await cacheService.del(this.listKey(tenantId));
    await auditService.log({
      tenantId, userId,
      module: 'Invoice',
      action: 'update',
      entityId: id,
      details: dto,
    });
    eventBus.emit(EVENTS.INVOICE_UPDATED, updated);
    return this.getById(tenantId, id);
  }

  async createInvoiceFromPO(po: any, userId: string) {
  const newInvoice = prisma.invoice.create({
    data: {
      tenantId: po.tenantId,
      storeId: po.storeId  ?? null,
      customerId: po.customerId ?? null, // can be manually set later
      purchaseOrderId: po.id,
      status: 'draft',
      issueDate: new Date(),
      dueDate: null,
      totalAmount: po.totalAmount,
      createdById: userId,
      notes: po.notes ?? 'Invoice Created from Purchase Order',
      items: {
        create: po.items.map(item => ({
          tenantProductId: item.tenantProductId,
          tenantProductVariantId: item.tenantProductVariantId,
          quantity: item.quantity,
          costPrice: item.costPrice,
        })),
      },
    },
  });

  eventBus.emit('invoice.created', { invoiceId: newInvoice.id });
  return newInvoice;
}

/**
   * Fetches an invoice along with its payments,
   * and returns aggregated payment status.
   */
  async getInvoiceWithPaymentStatus(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
        items: true,
        customer: true,
      },
    });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Sum up all successful payments
    const amountPaid = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const remainingAmount = Number(invoice.totalAmount) - amountPaid;

    return {
      ...invoice,
      amountPaid,
      remainingAmount,
      paymentCount: invoice.payments.length,
    };
  }

  async delete(
    tenantId: string,
    userId: string,
    id: string
  ): Promise<void> {
    await prisma.invoice.delete({ where:{ id } });
    await cacheService.del(this.listKey(tenantId));
    await auditService.log({
      tenantId, userId,
      module: 'Invoice',
      action: 'delete',
      entityId: id,
      details: {},
    });
    eventBus.emit(EVENTS.INVOICE_DELETED, { id, tenantId });
  }

  async applyPayment(
    tenantId: string,
    userId: string,
    id: string,
    dto: ApplyPaymentDto
  ): Promise<InvoiceDetailDto> {
    const inv = await this.getById(tenantId, id);
    // use existing paymentService to link
    await paymentService.create(tenantId, userId, {
      purchaseOrderId: undefined,
      transactionId: undefined,
      sessionId: undefined,
      paymentDate: new Date(),
      amount: dto.amount ?? inv.totalAmount,
      method: 'invoice',
      reference: `invoice:${inv.id}`
    });

    // recalc paymentStatus
    const payments = await prisma.payment.findMany({
      where: { reference: `invoice:${inv.id}` }
    });
    const paidSum = payments.reduce((s,p)=>s + p.amount, 0);
    const newStatus = paidSum >= inv.totalAmount
      ? 'paid'
      : paidSum > 0
        ? 'partiallyPaid'
        : 'unpaid';

    await prisma.invoice.update({
      where:{ id },
      data:{ paymentStatus: newStatus }
    });

    await cacheService.del(this.listKey(tenantId));
    await auditService.log({
      tenantId, userId,
      module: 'Invoice',
      action: 'applyPayment',
      entityId: id,
      details: dto,
    });
    eventBus.emit(EVENTS.INVOICE_PAYMENT_APPLIED, { invoiceId: id, paidSum });

    return this.getById(tenantId, id);
  }

async applyPaymentToInvoice(invoiceId: string, paymentId: string, amount: number) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error("Invoice not found");

  const newAmountPaid = invoice.amountPaid + amount;
  const status = newAmountPaid >= invoice.totalAmount ? 'paid' : 'partial';

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      amountPaid: newAmountPaid,
      status,
      payments: {
        connect: { id: paymentId },
      },
    },
  });

  return updatedInvoice;
}

  // payment.service.ts
async createPaymentAndApplyToInvoice(dto: CreateInvoicePaymentDto) {
  const { invoiceId, method, amount, reference, metadata } = dto;

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error("Invoice not found");

  const payment = await prisma.payment.create({
    data: {
      tenantId: invoice.tenantId,
      amount,
      method,
      reference,
      customerId: invoice.customerId,
      invoiceId,
      metadata,
      status: "successful",
    },
  });

  await invoiceService.applyPaymentToInvoice(invoiceId, payment.id, amount);

  eventBus.emit(EVENTS.PAYMENT_CREATED, {
  invoiceId,
  paymentId: payment.id,
});

  return payment;
}

  async getPdf(
    tenantId: string,
    id: string
  ): Promise<Buffer> {
    // assuming you have a PDF generator elsewhere
    const inv = await this.getById(tenantId, id);
    // stub: PDFService.generateInvoice(inv)
    const pdf = Buffer.from(`PDF for invoice ${id}`); 
    eventBus.emit(EVENTS.INVOICE_PDF_GENERATED, { invoiceId: id });
    return pdf;
  }
}

export const invoiceService = new InvoiceService();
