// src/modules/notification/types/notification.dto.ts

export interface SendEmailDto {
  to: string;                     // recipient email
  subject: string;                // subject line
  template: string;               // name of template (e.g. 'invoiceIssued')
  variables: Record<string, any>; // context for template
}

export interface SendEmailOptions {
  to: string;
  from: string;
  subject: string;
  html: string;
}
