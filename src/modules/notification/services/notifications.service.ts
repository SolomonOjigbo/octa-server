// src/modules/notification/notifications.service.ts


import { templates } from '../templates';
import { SendEmailDto, SendEmailOptions } from '../types/notification.dto';
import { auditService } from '@modules/audit/services/audit.service';
import { smtpClient } from '@shared/infra/notifications/smtp.client';
import nodemailer from 'nodemailer';

import SMTPTransport from 'nodemailer/lib/smtp-transport';

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
    
  }
}

export const notificationService = new NotificationService();
