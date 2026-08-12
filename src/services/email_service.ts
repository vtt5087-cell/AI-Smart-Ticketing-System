import nodemailer from 'nodemailer';

export interface EmailDispatchLog {
  id: string;
  ticket_id: string;
  recipient: string;
  subject: string;
  status: 'Queued' | 'Sent' | 'Failed';
  provider: string;
  timestamp: string;
  error_message?: string;
}

export const emailDispatchLogs: EmailDispatchLog[] = [];

export async function dispatch_ticket_email(
  ticket_id: string,
  recipient: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.replace(/\s+/g, '') : undefined,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USERNAME || 'noreply@company.com',
      to: recipient,
      subject: subject,
      text: body,
    });

    emailDispatchLogs.push({
      id: `elog-${Date.now()}`,
      ticket_id,
      recipient,
      subject,
      status: 'Sent',
      provider: 'SMTP',
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Email Dispatch Failed:', error);
    emailDispatchLogs.push({
      id: `elog-${Date.now()}`,
      ticket_id,
      recipient,
      subject,
      status: 'Failed',
      provider: 'SMTP',
      timestamp: new Date().toISOString(),
      error_message: error.message,
    });
    return { success: false, error: error.message };
  }
}
