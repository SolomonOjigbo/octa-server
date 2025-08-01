import { eventBus } from '@events/eventBus';
import { EVENTS } from '@events/events';
import { notificationService } from '@modules/notification/services/notification.service';
import { auditService } from '@modules/audit/services/audit.service';
import { AuditAction } from '@modules/audit/types/audit.dto';
import { userRoleService } from '@modules/userRole/services/userRole.service';

eventBus.on(EVENTS.TRANSACTION_CREATED, async (transaction) => {
  try {
    const emails = await userRoleService.getUserEmailsByRoleName(
      "tenant_admin",
      transaction.tenantId
    );
    
    for (const to of emails) {
      await notificationService.sendEmail({
        to,
        subject: `New Transaction Created - ${transaction.id}`,
        template: "transaction-created",
        variables: {
          ...transaction,
          date: new Date().toISOString()
        }
      });
    }
    
    await auditService.log({
      tenantId: transaction.tenantId,
      action: AuditAction.EMAIL_SENT,
      module: "Notification",
      details: {
        type: "transaction-created",
        transactionId: transaction.id
      }
    });
  } catch (error) {
    await auditService.log({
      tenantId: transaction.tenantId,
      action: AuditAction.EMAIL_FAILED,
      module: "Notification",
      details: {
        error: error.message,
        event: EVENTS.TRANSACTION_CREATED,
        transactionId: transaction.id
      }
    });
  }
});

eventBus.on(EVENTS.TRANSACTION_UPDATED, async (transaction) => {
  try {
    const emails = await userRoleService.getUserEmailsByRoleName(
      "tenant_admin",
      transaction.tenantId
    );
    
    for (const to of emails) {
      await notificationService.sendEmail({
        to,
        subject: `Transaction Updated - ${transaction.id}`,
        template: "transaction-updated",
        variables: {
          ...transaction,
          date: new Date().toISOString()
        }
      });
    }
    
    await auditService.log({
      tenantId: transaction.tenantId,
      action: AuditAction.EMAIL_SENT,
      module: "Notification",
      details: {
        type: "transaction-updated",
        transactionId: transaction.id
      }
    });
  } catch (error) {
    await auditService.log({
      tenantId: transaction.tenantId,
      action: AuditAction.EMAIL_FAILED,
      module: "Notification",
      details: {
        error: error.message,
        event: EVENTS.TRANSACTION_UPDATED,
        transactionId: transaction.id
      }
    });
  }
});

eventBus.on(EVENTS.TRANSACTION_DELETED, async (transaction) => {
  try {
    const emails = await userRoleService.getUserEmailsByRoleName(
      "tenant_admin",
      transaction.tenantId
    );
    
    for (const to of emails) {
      await notificationService.sendEmail({
        to,
        subject: `Transaction Deleted - ${transaction.id}`,
        template: "transaction-deleted",
        variables: {
          ...transaction,
          date: new Date().toISOString()
        }
      });
    }
    
    await auditService.log({
      tenantId: transaction.tenantId,
      action: AuditAction.EMAIL_SENT,
      module: "Notification",
      details: {
        type: "transaction-deleted",
        transactionId: transaction.id
      }
    });
  } catch (error) {
    await auditService.log({
      tenantId: transaction.tenantId,
      action: AuditAction.EMAIL_FAILED,
      module: "Notification",
      details: {
        error: error.message,
        event: EVENTS.TRANSACTION_DELETED,
        transactionId: transaction.id
      }
    });
  }
});