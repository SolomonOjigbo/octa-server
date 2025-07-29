// src/modules/reconciliation/reconciliation.service.ts


import { logger } from '@logging/logger';
import prisma from '@shared/infra/database/prisma';

export class ReconciliationService {
  async reconcileInvoicePayment(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
        items: true,
      },
    });

    if (!invoice) throw new Error('Invoice not found');

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const isFullyPaid = totalPaid >= invoice.totalAmount;

    // Update invoice status
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
        paymentStatus: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
      },
    });

    logger.info(`Reconciled Invoice ${invoiceId} – Status: ${isFullyPaid ? 'PAID' : 'PARTIALLY PAID'}`);
  }

  async reconcileTransactionWithStock(transactionId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { items: true },
    });

    if (!transaction) throw new Error('Transaction not found');

    for (const item of transaction.items) {
      const inventoryMatch = await prisma.inventory.findFirst({
        where: {
          tenantId: transaction.tenantId,
          tenantProductId: item.tenantProductId,
          storeId: transaction.storeId,
        },
      });

      if (!inventoryMatch) {
        logger.warn(`No inventory record found for ${item.tenantProductId}`);
        continue;
      }

      // Optional: validate quantity match
    }

    logger.info(`Reconciled transaction ${transactionId} with inventory.`);
  }

  async reconcileStockTransfer(stockTransferId: string) {
  const transfer = await prisma.stockTransfer.findUnique({
    where: { id: stockTransferId },
    include: {
      items: true,
      toStore: true,
      fromStore: true,
    },
  });

  if (!transfer) throw new Error('StockTransfer not found');

  for (const item of transfer.items) {
    const sourceInventory = await prisma.inventory.findFirst({
      where: {
        storeId: transfer.fromStoreId,
        tenantProductId: item.sourceTenantProductId,
        tenantId: transfer.tenantId,
      },
    });

    const destInventory = await prisma.inventory.findFirst({
      where: {
        storeId: transfer.toStoreId,
        tenantProductId: item.destTenantProductId,
        tenantId: transfer.destTenantId,
      },
    });

    if (!sourceInventory || !destInventory) {
      throw new Error(`Inventory missing for product ${item.sourceTenantProductId} and ${item.destTenantProductId}`);
    }

    // Optional: check if total quantity transferred aligns with recorded inventory change
  }

  // Optionally mark transfer as reconciled
  await prisma.stockTransfer.update({
    where: { id: stockTransferId },
    data: {
      status: 'RECONCILED', //To change to Reconcile status after prisma update
    },
  });

  logger.info(`Reconciled StockTransfer ${stockTransferId}`);
}

async reconcileTransactionInventory(transactionId: string) {
  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      items: true,
    },
  });

  if (!tx) throw new Error('Transaction not found');

  for (const item of tx.items) {
    const inventory = await prisma.inventory.findFirst({
      where: {
        tenantProductId: item.tenantProductId,
        storeId: tx.storeId,
        tenantId: tx.tenantId,
      },
    });

    if (!inventory) {
      logger.warn(`No inventory found for product ${item.tenantProductId}`);
      continue;
    }

    // Optional: compare inventory history or movements
  }

  logger.info(`Transaction ${transactionId} reconciled with inventory.`);
}

}

export const reconciliationService = new ReconciliationService();