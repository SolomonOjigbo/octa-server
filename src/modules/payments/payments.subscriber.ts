import { eventBus } from '@events/eventBus';
import { EVENTS } from '@events/events';
import { notificationService } from '@modules/notification/services/notification.service';
import { auditService } from '@modules/audit/services/audit.service';
import { AuditAction } from '@modules/audit/types/audit.dto';
import { userRoleService } from '@modules/userRole/services/userRole.service';

eventBus.on(EVENTS.PAYMENT_COMPLETED, async (payment) => {
  try {
    const emails = await userRoleService.getUserEmailsByRoleName(
      "tenant_admin",
      payment.tenantId
    );
    
    for (const to of emails) {
      await notificationService.sendEmail({
        to,
        subject: `Payment Completed - ${payment.id}`,
        template: "payment-receipt",
        variables: {
          ...payment,
          date: new Date().toISOString()
        }
      });
    }
    
    await auditService.log({
      tenantId: payment.tenantId,
      action: AuditAction.EMAIL_SENT,
      module: "Notification",
      details: {
        type: "payment-completed",
        paymentId: payment.id
      }
    });
  } catch (error) {
    await auditService.log({
      tenantId: payment.tenantId,
      action: AuditAction.EMAIL_FAILED,
      module: "Notification",
      details: {
        error: error.message,
        event: EVENTS.PAYMENT_COMPLETED,
        paymentId: payment.id
      }
    });
  }
});

eventBus.on(EVENTS.PAYMENT_REFUNDED, async (refund) => {
  try {
    const emails = await userRoleService.getUserEmailsByRoleName(
      "tenant_admin",
      refund.tenantId
    );
    
    for (const to of emails) {
      await notificationService.sendEmail({
        to,
        subject: `Payment Refunded - ${refund.id}`,
        template: "payment-refund",
        variables: {
          ...refund,
          date: new Date().toISOString()
        }
      });
    }
    
    await auditService.log({
      tenantId: refund.tenantId,
      action: AuditAction.EMAIL_SENT,
      module: "Notification",
      details: {
        type: "payment-refunded",
        refundId: refund.id
      }
    });
  } catch (error) {
    await auditService.log({
      tenantId: refund.tenantId,
      action: AuditAction.EMAIL_FAILED,
      module: "Notification",
      details: {
        error: error.message,
        event: EVENTS.PAYMENT_REFUNDED,
        refundId: refund.id
      }
    });
  }
});

eventBus.on(EVENTS.PAYMENT_REVERSED, async (payment) => {
  try {
    const emails = await userRoleService.getUserEmailsByRoleName(
      "tenant_admin",
      payment.tenantId
    );
    
    for (const to of emails) {
      await notificationService.sendEmail({
        to,
        subject: `Payment Reversed - ${payment.id}`,
        template: "payment-reversed",
        variables: {
          ...payment,
          date: new Date().toISOString()
        }
      });
    }
    
    await auditService.log({
      tenantId: payment.tenantId,
      action: AuditAction.EMAIL_SENT,
      module: "Notification",
      details: {
        type: "payment-reversed",
        paymentId: payment.id
      }
    });
  } catch (error) {
    await auditService.log({
      tenantId: payment.tenantId,
      action: AuditAction.EMAIL_FAILED,
      module: "Notification",
      details: {
        error: error.message,
        event: EVENTS.PAYMENT_REVERSED,
        paymentId: payment.id
      }
    });
  }
});

eventBus.on(EVENTS.PAYMENT_DELETED, async (payment) => {
  try {
    const emails = await userRoleService.getUserEmailsByRoleName(
      "tenant_admin",
      payment.tenantId
    );
    
    for (const to of emails) {
      await notificationService.sendEmail({
        to,
        subject: `Payment Deleted - ${payment.id}`,
        template: "payment-deleted",
        variables: {
          ...payment,
          date: new Date().toISOString()
        }
      });
    }
    
    await auditService.log({
      tenantId: payment.tenantId,
      action: AuditAction.EMAIL_SENT,
      module: "Notification",
      details: {
        type: "payment-deleted",
        paymentId: payment.id
      }
    });
  } catch (error) {
    await auditService.log({
      tenantId: payment.tenantId,
      action: AuditAction.EMAIL_FAILED,
      module: "Notification",
      details: {
        error: error.message,
        event: EVENTS.PAYMENT_DELETED,
        paymentId: payment.id
      }
    });
  }
});
