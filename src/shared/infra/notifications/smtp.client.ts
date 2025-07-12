import { logger } from '@logging/logger';
import nodemailer from 'nodemailer';

import SMTPTransport from 'nodemailer/lib/smtp-transport';

interface SendEmailOptions {
  to: string;
  from: string;
  subject: string;
  html: string;
}

export class SMTPClient {

    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    } as SMTPTransport.Options);

    sendEmail = async ({ to, from, subject, html }: SendEmailOptions) => {
     try {
       await this.transporter.sendMail({
         from,
         to,
         subject,
         html,
       });
       return true;
     } catch (error) {
       logger.error('Email sending error:', error);
       return false;
     }
    };

    sendVerificationEmail = async (email: string, token: string) => {
     const verificationUrl = `${process.env.BASE_API_URL}/verify-email?token=${token}`;
     
     const html = `
       <div>
         <h1>Verify Your Email</h1>
         <p>Click the link below to verify your email address:</p>
         <a href="${verificationUrl}">Verify Email</a>
         <p>Or copy and paste this URL into your browser:</p>
         <p>${verificationUrl}</p>
         <p>This link will expire in 24 hours.</p>
       </div>
     `;
    
     return this.sendEmail({
       to: email,
       from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
       subject: 'Verify Your Email Address',
       html,
     });
    };

    sendPasswordResetEmail = async (email: string, token: string) => {
      const resetUrl = `${process.env.BASE_API_URL}/reset-password?token=${token}`;
      
      const html = `
        <div>
          <h1>Password Reset Request</h1>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>Or copy and paste this URL into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `;
    
      return this.sendEmail({
        to: email,
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
        subject: 'Password Reset Request',
        html,
      });
    };
}


export const smtpClient = new SMTPClient();
