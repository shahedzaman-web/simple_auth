import nodemailer, { Transporter } from 'nodemailer';
import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: Transporter;

const getTransporter = (): Transporter => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

export const emailTemplates = {
  verification: (name: string, otp: string) => ({
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello ${name},</h2>
        <p>Your email verification code is:</p>
        <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
          ${otp}
        </div>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  }),
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transport = getTransporter();
    await transport.sendMail({
      from: `"${process.env.APP_NAME || 'E-Commerce'}" <${process.env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    logger.info(`Email sent to ${options.to}`);
  } catch (error) {
    logger.error(`Email sending failed: ${error}`);
    throw new Error('Email could not be sent');
  }
};