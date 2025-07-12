// src/shared/infra/notifications/sendgrid.client.ts
import sgMail from '@sendgrid/mail';
import { getEnvVariable } from '@shared/infra/config/env';


const env = {
  sendgridApiKey: getEnvVariable('SENDGRID_API_KEY'),
};

sgMail.setApiKey(env.sendgridApiKey);
export const sendgrid = sgMail;
