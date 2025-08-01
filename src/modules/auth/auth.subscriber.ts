import { eventBus } from "@events/eventBus";
import { EVENTS } from "@events/events";
import { auditService } from "@modules/audit/services/audit.service";
import { AuditAction } from "@modules/audit/types/audit.dto";
import { notificationService } from "@modules/notification/services/notification.service";




eventBus.on(EVENTS.USER_INVITED, async (data) => {
  const { email, name, inviteToken, inviteExpires, store, tenantId, role} = data;
  
  try {
    await notificationService.sendEmail({
      to: email,
      subject: `Invitation to join ${tenantId}`,
      template: "user-invitation",
      variables: {
        name,
        storeName: store.name,
        role: role,
        tenantId: tenantId,
         inviteExpires:  inviteExpires,
        acceptLink: `${process.env.APP_URL}/accept-invite?token=${inviteToken}`
      }
    });

    await auditService.log({
      tenantId: data.tenantId,
      action: AuditAction.EMAIL_SENT,
      module: "Notification",
      details: {
        type: "user-invitation",
        recipient: email
      }
    });
  } catch (error) {
    await auditService.log({
      tenantId: data.tenantId,
      action: AuditAction.EMAIL_FAILED,
      module: "Notification",
      details: {
        error: error.message,
        event: EVENTS.USER_INVITED
      }
    });
  }
});

eventBus.on(EVENTS.PASSWORD_RESET_REQUESTED, async (data) => {
  const { email, resetToken, expiresAt, tenantId  } = data;
  
  try {
    await notificationService.sendEmail({
      to: email,
      subject: "Password Reset Request",
      template: "password-reset",
      variables: {
        resetLink: `${process.env.APP_URL}/reset-password?token=${resetToken}`,
        expiresAt: expiresAt.toISOString()
      }
    });

    await auditService.log({
        tenantId: tenantId,
      action: AuditAction.EMAIL_SENT,
      module: "Notification",
      details: {
        type: "password-reset",
        recipient: email
      }
    });
  } catch (error) {
    await auditService.log({
        tenantId: data.tenantId,
        action: AuditAction.EMAIL_FAILED,
        module: "Notification",
        details: {
            error: error.message,
            event: EVENTS.PASSWORD_RESET_REQUESTED
        }
    });
  }
});

 eventBus.on(EVENTS.EMAIL_VERIFICATION_REQUESTED, async (data) => {
    const { email, inviteToken, expiresAt, userId, tenantId  } = data;
        try {
    await notificationService.sendEmail({
      to: email,
      subject: "Email Verification Request",
      template: "email-verification",
      variables: {
        resetLink: `${process.env.APP_URL}/reset-password?token=${inviteToken}`,
        expiresAt: expiresAt.toISOString()
      }
    });

    await auditService.log({
        tenantId: tenantId,
      action: AuditAction.EMAIL_SENT,
      module: "Notification",
      details: {
        type: "email-verification",
        recipient: email
      }
    });
  } catch (error) {
    await auditService.log({
        tenantId: data.tenantId,
        action: AuditAction.EMAIL_FAILED,
        module: "Notification",
        details: {
            error: error.message,
            event: EVENTS.EMAIL_VERIFICATION_REQUESTED
        }
    });
  }
      });
 eventBus.on(EVENTS.USER_ACTIVATED, async (data) => {
    const { email, userId, tenantId, store  } = data;
        try {
    await notificationService.sendEmail({
      to: email,
      subject: "Account Activated Confirmation!",
      template: "account-activated.hbs",
      variables: {
        email, 
        storeName: store.name,
        userId,
        tenantId: tenantId,
      }
    });

    await auditService.log({
        tenantId: tenantId,
      action: AuditAction.USER_ACTIVATED,
      module: "Notification",
      details: {
        type: "email-verification",
        recipient: email
      }
    });
  } catch (error) {
    await auditService.log({
        tenantId: data.tenantId,
        action: AuditAction.EMAIL_FAILED,
        module: "Notification",
        details: {
            error: error.message,
            event: EVENTS.USER_ACTIVATED
        }
    });
  }
      });
