import { eventBus } from '@events/eventBus';
import { EVENTS } from '@events/events';
import { logger } from '@logging/logger';
import { auditService } from '@modules/audit/services/audit.service';
import { notificationService } from '@modules/notification/services/notification.service';
import { userRoleService } from '@modules/userRole/services/userRole.service';

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
        "tenant_catalog_admin",
        payload.tenantId
      );
      for (const to of emails) {
        await notificationService.sendEmail({
          to,
          subject: `POS Payment Created`,
          template: "tenantPOSTemplate",
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
        "tenant_catalog_admin",
        payload.tenantId
      );
    for (const to of emails) {
      await notificationService.sendEmail({
        to,
        subject: `POS Cash Drop`,
        template: "tenantPOSTemplate",
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
        "tenant_catalog_admin",
        payload.tenantId
      );
    for (const to of emails) {
      await notificationService.sendEmail({
        to,
        subject: `POS SALE COMPLETED`,
        template: "tenantPOSTemplate",
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
        "tenant_catalog_admin",
        payload.tenantId
      );
      for (const to of emails) {
        await notificationService.sendEmail({

            to,
            subject: `POS RETURN CREATED`,
            template: "tenantPOSTemplate",
            variables: payload,
        });
    }
  logger.info(`[POS] Return processed: ${payload.transactionId}`);
});
