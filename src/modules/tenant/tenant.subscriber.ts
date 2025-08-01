
import { EVENTS } from "@events/events";

import { eventBus } from "@events/eventBus";
import { notificationService } from "@modules/notification/services/notification.service";
import { auditService } from "@modules/audit/services/audit.service";
import { AuditAction } from "@modules/audit/types/audit.dto";

eventBus.on(EVENTS.TENANT_ONBOARDED, async (data) => {
  try{
  await notificationService.sendEmail({
    to: data.adminEmail,
    subject: "Welcome to Octa!",
    template: "tenant-welcome",
    variables: {
        name: data.adminName,
        tenantName: data.tenantName,
      verifyLink: `${process.env.BASE_URL}/verify?token=${data.verifyToken}`
    
    }
  });
  await auditService.log({
      tenantId: data.tenantId,
      action: AuditAction.EMAIL_SENT,
      module: "Notification",
      details: {
        type: "welcome-email",
        recipient: data.adminEmail,
      },
    });
  } catch (error) {
    await auditService.log({
      tenantId: data.tenantId,
      action: AuditAction.EMAIL_FAILED,
      module: "Auth, Notification",
      details: {
        error: error.message,
        event: EVENTS.TENANT_ONBOARDED,
      },
    });
  }
});

eventBus.on(EVENTS.USER_INVITED, async (data) => {
  // Send invitation email
});