import { eventBus } from '@events/eventBus';
import { EVENTS } from '@events/events';
import { logger } from '@logging/logger';
import { auditService } from '@modules/audit/services/audit.service';
import { inventoryFlowService } from '@modules/inventory/services/inventoryFlow.service';
import { notificationService } from '@modules/notification/services/notification.service';
import { transactionService } from '@modules/transactions/services/transaction.service';
import { userRoleService } from '@modules/userRole/services/userRole.service';
import { posService } from './services/pos.service';

eventBus.on(EVENTS.POS_SESSION_OPENED, async (payload) => {
  logger.info(`[POS] Session opened for user ${payload.userId}`);
  await auditService.log({
    tenantId: payload.tenantId,
    userId: payload.userId,
    module: 'pos',
    action: 'open_session',
    entityId: payload.sessionId,
    details: payload
  });
});

eventBus.on(EVENTS.POS_SESSION_CLOSED, async (payload) => {
  logger.info(`[POS] Session closed for user ${payload.userId}`);
  await auditService.log({
    tenantId: payload.tenantId,
    userId: payload.userId,
    module: 'pos',
    action: 'close_session',
    entityId: payload.sessionId,
    details: payload.summary,
  });
});

eventBus.on(EVENTS.POS_PAYMENT_CREATED, async (payload) => {
  logger.info(`[POS] Payment recorded: ${payload.paymentId}`);
  await auditService.log({
    tenantId: payload.tenantId,
    module: 'payment',
    action: 'create',
    entityId: payload.paymentId,
    userId: payload.userId,
    details: {},
  });
  const emails = await userRoleService.getUserEmailsByRoleName(
        "tenant_admin",
        payload.tenantId
      );
      for (const to of emails) {
        await notificationService.sendEmail({
          to,
          subject: `POS Payment Created`,
          template: "tenantPOS",
          variables: payload,
        });
    }
});

eventBus.on(EVENTS.POS_CASH_DROP, async (payload) => {
  logger.info(`[POS] Cash dropped: ₦${payload.amount}`);
  await auditService.log({
    tenantId: payload.tenantId,
    module: 'pos',
    action: 'cash_drop',
    entityId: payload.dropId,
    userId: payload.userId,
    details: { amount: payload.amount },
  });
   const emails = await userRoleService.getUserEmailsByRoleName(
        "tenant_admin",
        payload.tenantId
      );
    for (const to of emails) {
      await notificationService.sendEmail({
        to,
        subject: `POS Cash Drop`,
        template: "tenantPOS",
        variables: payload,
      });
    }
});

eventBus.on(EVENTS.POS_ORDER_CREATED, async (payload) => {
  logger.info(`[POS] Sale started: ${payload.transactionId}`);
});

eventBus.on(EVENTS.POS_TRANSACTION_CREATED, async (payload) => {
  auditService.log({
    tenantId: payload.tenantId,
    module: 'POS',
    action: 'transaction_created',
    entityId: payload.transactionId,
    userId: payload.userId ?? null,
    details: payload,
  });  
  logger.info(`[POS] Transaction Created: ${payload.transactionId}`);
});

eventBus.on(EVENTS.POS_SALE_COMPLETED, async (payload) => {
    await auditService.log({
        tenantId: payload.tenantId,
        module: 'POS',
        action:'sale_completed',
        entityId: payload.transactionId,
        userId: payload.userId,
    });
    const emails = await userRoleService.getUserEmailsByRoleName(
        "tenant_admin",
        payload.tenantId
      );
    for (const to of emails) {
      await notificationService.sendEmail({
        to,
        subject: `POS SALE COMPLETED`,
        template: "tenantPOS",
        variables: payload,
      });
    }
    logger.info(`[POS] Sale completed: ${payload.transactionId}`);
});

eventBus.on(EVENTS.POS_RETURN_CREATED, async (payload) => {

    await auditService.log({
        
        tenantId: payload.tenantId,
        module: 'POS',
        action:'return_created',
        entityId: payload.transactionId,
        userId: payload.userId,
        details: payload,
    });
    const emails = await userRoleService.getUserEmailsByRoleName(
        "tenantAdmin",
        payload.tenantId
      );
      for (const to of emails) {
        await notificationService.sendEmail({

            to,
            subject: `POS RETURN CREATED`,
            template: "tenantPOS",
            variables: payload,
        });
    }
  logger.info(`[POS] Return processed: ${payload.transactionId}`);
});

eventBus.on('POSSession.closed', async (session) => {
  const transactions = await transactionService.getTransactions(session.id);

  for (const txn of transactions) {
    for (const item of txn.items) {
      await inventoryFlowService.recordConsumption({
        tenantId: txn.tenantId,
        storeId: txn.storeId,
        tenantProductId: item.tenantProductId,
        quantity: item.quantity,
        transactionId: item.id,
        reference: " POS Session Closed",
    batchNumber: item.batchNumber,
    name: item.name,
    sku: item.sku,
    expiryDate: item.expiryDate,
    userId: txn.createdById,
      });
    }
  }
  // Dispatch POS summary email
     const emails = await userRoleService.getUserEmailsByRoleName(
        "tenant_admin",
        session.tenantId
      );
  for (const to of emails) {
  await notificationService.sendEmail({
    to: to,
    subject: 'POS Session Summary',
    template: 'tenantPOS',
    variables: { session, transactions },
  });
}
});
// Add to existing file
// eventBus.on(EVENTS.POS_SESSION_SUMMARY, async (payload) => {
//   logger.info(`[POS] Session summary for ${payload.sessionId}`);
  
//   const emails = await userRoleService.getUserEmailsByRoleName(
//     "tenant_admin",
//     payload.tenantId
//   );
  
//   for (const to of emails) {
//     await notificationService.sendEmail({
//       to,
//       subject: `POS Session Summary - Session #${payload.sessionId}`,
//       template: "pos-session-summary",
//       variables: {
//         ...payload,
//         date: new Date().toISOString()
//       }
//     });
//   }
  
//   await auditService.log({
//     tenantId: payload.tenantId,
//     action: 'SESSION_SUMMARY_SENT',
//     module: 'POS',
//     entityId: payload.sessionId,
//     details: payload.summary
//   });
// });
