// src/modules/notification/notifications.service.ts


import { templates } from '../templates';
import { SendEmailDto, SendEmailOptions } from '../types/notification.dto';
import { auditService } from '@modules/audit/services/audit.service';
import { smtpClient } from '@shared/infra/notifications/smtp.client';


export class NotificationService {
  private from = process.env.EMAIL_FROM!;

  async sendEmail(dto: SendEmailDto) {
    const tpl = templates[dto.template];
    if (!tpl) throw new Error(`Unknown template ${dto.template}`);

    const html = tpl(dto.variables);

    const msg = {
      to: dto.to,
      from: this.from,
      subject: dto.subject,
      html,
    } as SendEmailOptions;

    await smtpClient.sendEmail(msg);
    await auditService.log({
        tenantId: null,
        userId: null,
        module: 'notification',
        action:'sendEmail',
        entityId: null,
        details: dto,
    });
    
  }

  async sendEmailWithAttachment(dto: SendEmailDto & {
  attachments: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}) {
  const tpl = templates[dto.template];
  if (!tpl) throw new Error(`Unknown template ${dto.template}`);

  const html = tpl(dto.variables);

  const msg: SendEmailOptions = {
    to: dto.to,
    from: this.from,
    subject: dto.subject,
    html,
    attachments: dto.attachments
  };

  await smtpClient.sendEmail(msg);
  await auditService.log({
    tenantId: null,
    userId: null,
    module: 'notification',
    action: 'sendEmailWithAttachment',
    entityId: null,
    details: {
      to: dto.to,
      subject: dto.subject,
      template: dto.template,
      attachmentCount: dto.attachments.length
    },
  });
}
}

export const notificationService = new NotificationService();
