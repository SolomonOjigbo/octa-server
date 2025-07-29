// src/modules/invoice/services/invoice.service.ts
import {
  CreateInvoiceDto,
  IssueInvoiceDto,
  UpdateInvoiceDto,
  ApplyPaymentDto,
  InvoiceResponseDto,
  InvoiceDetailDto,
  CreateInvoicePaymentDto,
  InvoiceStatus,
  InvoiceReferenceType,
} from '../types/invoice.dto';
import { cacheService } from '@cache/cache.service';
import { auditService } from '@modules/audit/services/audit.service';
import { eventBus } from '@events/eventBus';
import { EVENTS } from '@events/events';
import { transactionService } from '@modules/transactions/services/transaction.service';
import { paymentService } from '@modules/payments/services/payment.service';
import prisma from '@shared/infra/database/prisma';
import { AppError } from '@common/constants/app.errors';
import { PaymentStatus, TransactionReferenceType, TransactionStatus } from '@modules/transactions/types/transaction.dto';


export class InvoiceService {
  private listKey(tid: string) { return `invoices:${tid}`; }

  private async generateInvoiceNo(tenantId: string): Promise<string> {
    const count = await prisma.invoice.count({ where: { tenantId } });
    return `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
  }

  async list(
    tenantId: string,
    filters: {
      status?: InvoiceStatus;
      referenceType?: InvoiceReferenceType;
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
      customerId, startDate, endDate, page = 1, limit = 20
    } = filters;

    const where: any = { tenantId };
    if (status) where.status = status;
    if (referenceType) where.referenceType = referenceType;
    if (referenceId) where.referenceId = referenceId;
    if (customerId) where.customerId = customerId;
    if (startDate) where.issueDate = { gte: startDate };
    if (endDate) where.issueDate = { ...(where.issueDate || {}), lte: endDate };

    const data = await prisma.invoice.findMany({
      where,
      skip: (page - 1) * limit,
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
        payments: { 
          select: { 
            id: true, 
            amount: true, 
            method: true, 
            paymentDate: true,
            status: true 
          } 
        },
      },
    });
    if (!inv) throw new AppError('Invoice not found', 404);

    return {
      id: inv.id,
      tenantId: inv.tenantId,
      referenceType: inv.referenceType as InvoiceReferenceType,
      referenceId: inv.referenceId || undefined,
      customerId: inv.customerId || undefined,
      invoiceNo: inv.invoiceNo || undefined,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate || undefined,
      status: inv.status as InvoiceStatus,
      subTotal: inv.subTotal,
      taxTotal: inv.taxTotal,
      totalAmount: inv.totalAmount,
      paymentStatus: inv.paymentStatus as PaymentStatus,
      // metadata: inv.metadata,
      createdById: inv.createdById || undefined,
      updatedById: inv.updatedById || undefined,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
      items: inv.items.map(i => ({
        productId: i.productId,
        variantId: i.variantId || undefined,
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxAmount: i.taxAmount,
        lineTotal: i.lineTotal,
      })),
      payments: inv.payments.map(p => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        paidAt: p.paymentDate,
        status: p.status as PaymentStatus
      }))
    };
  }

  async createDraft(
    tenantId: string,
    userId: string,
    dto: CreateInvoiceDto
  ): Promise<InvoiceResponseDto> {
    // Update related document status
    if (dto.referenceType === 'PURCHASE_ORDER' && dto.referenceId) {
      await prisma.purchaseOrder.update({
        where: { id: dto.referenceId },
        data: { status: 'INVOICED' }
      });
    }
    if (dto.referenceType === 'POS_TRANSACTION' && dto.referenceId) {
      await prisma.transaction.update({
        where: { id: dto.referenceId },
        data: { status: 'POSTED' }
      });
    }
    if (dto.referenceType === 'STOCK_TRANSFER' && dto.referenceId) {
      await prisma.stockTransfer.update({
        where: { id: dto.referenceId },
        data: { status: 'CANCELLED' }
      });
    }

    // Compute totals
    const subTotal = dto.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const taxTotal = dto.items.reduce((s, i) => s + i.taxAmount, 0);
    const totalAmount = subTotal + taxTotal;

    const inv = await prisma.invoice.create({
      data: {
        tenant: {connect: {id: tenantId}},
        createdBy: {connect: {id: userId}},
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        invoiceNo: dto.invoiceNo,
        customer: {connect: {id: dto.customerId}},
        dueDate: dto.dueDate,
        subTotal,
        taxTotal,
        totalAmount,
        status: 'DRAFT',
        paymentStatus: 'UNPAID',
        // metadata: dto.metadata,
        items: {
          create: dto.items.map(i => ({
            productId: i.productId,
            variantId: i.variantId,
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            taxAmount: i.taxAmount,
            lineTotal: i.unitPrice * i.quantity + i.taxAmount,
          }))
        }
      }
    });

    await cacheService.del(this.listKey(tenantId));
    await auditService.log({
      tenantId,
      userId,
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
    const existing = await prisma.invoice.findFirst({ where: { id, tenantId } });
    if (!existing) throw new AppError('Invoice not found', 404);
    if (existing.status !== 'DRAFT') throw new AppError('Only draft can be issued', 400);

    const invoiceNo = dto.invoiceNo || await this.generateInvoiceNo(tenantId);

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        invoiceNo,
        dueDate: dto.dueDate || existing.dueDate,
        status: 'ISSUED',
        issueDate: new Date(),
      }
    });

    // Create receivable transaction
    await transactionService.createTransaction(tenantId, userId, {
      referenceType: TransactionReferenceType.INVOICE,
      referenceId: updated.id,
      amount: updated.totalAmount,
      paymentMethod: "CARD",
      status: TransactionStatus.POSTED,
      paymentStatus: PaymentStatus.UNPAID,
      metadata: {},
    });

    await cacheService.del(this.listKey(tenantId));
    await auditService.log({
      tenantId,
      userId,
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
      tenantId,
      userId,
      module: 'Invoice',
      action: 'update',
      entityId: id,
      details: dto,
    });
    eventBus.emit(EVENTS.INVOICE_UPDATED, updated);
    return this.getById(tenantId, id);
  }

  async delete(
    tenantId: string,
    userId: string,
    id: string
  ): Promise<void> {
    await prisma.invoice.delete({ where: { id } });
    await cacheService.del(this.listKey(tenantId));
    await auditService.log({
      tenantId,
      userId,
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
    return prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.findUnique({
        where: { id },
        include: { payments: true }
      });
      
      if (!inv) throw new AppError('Invoice not found', 404);
      
      const paidSum = inv.payments.reduce((sum, p) => sum + p.amount, 0);
      const paymentAmount = dto.amount ?? (inv.totalAmount - paidSum);
      
      if (paidSum + paymentAmount > inv.totalAmount) {
        throw new AppError('Payment amount exceeds invoice total', 400);
      }

      const payment = await tx.payment.create({
        data: {
          tenant: { connect: {id:  tenantId}},
          amount: paymentAmount,
          method: dto.method || 'INVOICE',
          reference: dto.reference || `invoice:${id}`,
          invoice: {connect: {id: inv.id}},
          createdBy: {connect: {id: userId}},
          status: PaymentStatus.PAID,
          referenceType: 'INVOICE'
        }
      });

      const newStatus = (paidSum + paymentAmount) >= inv.totalAmount
        ? 'PAID'
        : paidSum > 0
          ? 'PARTIALLY_PAID'
          : 'UNPAID';

      await tx.invoice.update({
        where: { id },
        data: { 
          paymentStatus: newStatus,
          status: newStatus === 'PAID' ? 'PAID' : inv.status
        }
      });

      if (newStatus === 'PAID') {
        await transactionService.createTransaction(tenantId, userId, {
          referenceType: TransactionReferenceType.INVOICE,
          referenceId: id,
          amount: paymentAmount,
          paymentMethod: payment.method,
          status: TransactionStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID
        });
      }

      await cacheService.del(this.listKey(tenantId));
      await auditService.log({
        tenantId,
        userId,
        module: 'Invoice',
        action: 'applyPayment',
        entityId: id,
        details: dto,
      });
      eventBus.emit(EVENTS.INVOICE_PAYMENT_APPLIED, { 
        invoiceId: id, 
        paymentId: payment.id,
        amount: paymentAmount 
      });

      return this.getById(tenantId, id);
    });
  }

  async getPdf(
    tenantId: string,
    id: string
  ): Promise<Buffer> {
    const inv = await this.getById(tenantId, id);
    const pdf = Buffer.from(`PDF for invoice ${id}`);
    eventBus.emit(EVENTS.INVOICE_PDF_GENERATED, { invoiceId: id });
    return pdf;
  }

  // Scheduled job for checking overdue invoices
  async checkOverdueInvoices() {
    const overdue = await prisma.invoice.findMany({
      where: {
        status: 'ISSUED',
        dueDate: { lt: new Date() }
      }
    });
    
    for (const inv of overdue) {
      await prisma.invoice.update({
        where: { id: inv.id },
        data: { status: 'OVERDUE' }
      });
      eventBus.emit(EVENTS.INVOICE_OVERDUE, inv);
    }
  }
  // Add to InvoiceService class in invoice.service.ts
async createFromPurchaseOrder(
  tenantId: string,
  userId: string,
  purchaseOrderId: string
): Promise<InvoiceResponseDto> {
  return prisma.$transaction(async (tx) => {
    // 1. Get purchase order with items
    const po = await tx.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { items: true, supplier: true, tenant: true }
    });
    
    if (!po) throw new AppError('Purchase Order not found', 404);
    if (po.status !== 'APPROVED') {
      throw new AppError('Only approved purchase orders can be invoiced', 400);
    }

    // 2. Prepare invoice items
    const items = po.items.map(item => ({
      productId: item.tenantProductId,
      variantId: item.tenantProductVariantId || undefined,
      description: `PO Item: ${item.tenantProductId}`,
      quantity: item.quantity,
      unitPrice: item.costPrice,
      taxAmount: 0, // Assuming no tax for now
    }));

    // 3. Calculate totals
    const subTotal = items.reduce((sum, item) => 
      sum + (item.unitPrice * item.quantity), 0);
    const taxTotal = items.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subTotal + taxTotal;

    // 4. Create invoice
    const invoice = await tx.invoice.create({
      data: {
        tenant: {connect: {id:tenantId}},
        createdBy: {connect: {id: userId}},
        referenceType: 'PURCHASE_ORDER',
        referenceId: purchaseOrderId,
        invoiceNo: await this.generateInvoiceNo(tenantId),
        supplier:{connect: {id:po.supplierId}},  // Added to track supplier
        // customer: {connect: {id: po.tenantId}},
        subTotal,
        taxTotal,
        totalAmount,
        status: 'DRAFT',
        paymentStatus: 'UNPAID',
        items: {
          create: items.map(i => ({
            productId: i.productId,
            variantId: i.variantId,
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            taxAmount: i.taxAmount,
            lineTotal: i.unitPrice * i.quantity + i.taxAmount,
          }))
        }
      }
    });

    // 5. Update PO status
    await tx.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: { status: 'INVOICED' }
    });

    // 6. Cache and events
    await cacheService.del(this.listKey(tenantId));
    eventBus.emit(EVENTS.INVOICE_CREATED, invoice);
    eventBus.emit(EVENTS.PURCHASE_ORDER_INVOICED, {
      purchaseOrderId,
      invoiceId: invoice.id
    });

    return this.getById(tenantId, invoice.id);
  });
}
}

export const invoiceService = new InvoiceService();

// Initialize overdue check (run daily)
setInterval(() => invoiceService.checkOverdueInvoices(), 24 * 60 * 60 * 1000);