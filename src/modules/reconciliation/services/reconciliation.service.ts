// src/modules/reconciliation/reconciliation.service.ts


import { logger } from '@logging/logger';
import prisma from '@shared/infra/database/prisma';

export class ReconciliationService {
  async reconcileInvoicePayment(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
        transactions: true,
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
        status: isFullyPaid ? 'paid' : 'partially_paid',
        paymentStatus: isFullyPaid ? 'complete' : 'incomplete',
        paidAt: isFullyPaid ? new Date() : undefined,
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
          productId: item.productId,
          storeId: transaction.storeId,
        },
      });

      if (!inventoryMatch) {
        logger.warn(`No inventory record found for ${item.productId}`);
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
      sourceStore: true,
      destinationStore: true,
    },
  });

  if (!transfer) throw new Error('StockTransfer not found');

  for (const item of transfer.items) {
    const sourceInventory = await prisma.inventory.findFirst({
      where: {
        storeId: transfer.sourceStoreId,
        productId: item.productId,
        tenantId: transfer.tenantId,
      },
    });

    const destInventory = await prisma.inventory.findFirst({
      where: {
        storeId: transfer.destinationStoreId,
        productId: item.productId,
        tenantId: transfer.destinationTenantId,
      },
    });

    if (!sourceInventory || !destInventory) {
      throw new Error(`Inventory missing for product ${item.productId}`);
    }

    // Optional: check if total quantity transferred aligns with recorded inventory change
  }

  // Optionally mark transfer as reconciled
  await prisma.stockTransfer.update({
    where: { id: stockTransferId },
    data: {
      status: 'reconciled',
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
        productId: item.productId,
        storeId: tx.storeId,
        tenantId: tx.tenantId,
      },
    });

    if (!inventory) {
      logger.warn(`No inventory found for product ${item.productId}`);
      continue;
    }

    // Optional: compare inventory history or movements
  }

  logger.info(`Transaction ${transactionId} reconciled with inventory.`);
}

}

export const reconciliationService = new ReconciliationService();