// src/shared/infra/notifications/gmail.client.ts
import nodemailer from 'nodemailer';


export const transporter = nodemailer.createTransport({
  service: 'Gmail',
   port: 587,
  secure: true,
  auth: {
    user: process.env.gmailUser,
    pass: process.env.gmailPass,
  },
  
});