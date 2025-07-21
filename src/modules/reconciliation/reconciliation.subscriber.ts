// src/modules/reconciliation/reconciliation.subscriber.ts


import { eventBus } from '@events/eventBus';
import { reconciliationService } from './services/reconciliation.service';


eventBus.on('payment.created', async (payload) => {
  await reconciliationService.reconcileInvoicePayment(payload.invoiceId);
});

eventBus.on('stockTransfer.received', async ({ stockTransferId }) => {
  await reconciliationService.reconcileStockTransfer(stockTransferId);
});

eventBus.on('transaction.completed', async ({ transactionId }) => {
  await reconciliationService.reconcileTransactionInventory(transactionId);
});
