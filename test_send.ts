import { dispatch_ticket_email } from './src/services/email_service.js';
import { config } from 'dotenv';
config();

async function test() {
  const recipient = process.env.FROM_EMAIL || process.env.SMTP_USERNAME;
  if (!recipient) {
    console.log('No recipient found in env.');
    return;
  }
  
  console.log(`Sending test email to ${recipient}...`);
  const result = await dispatch_ticket_email(
    'test-ticket-id-123',
    recipient,
    '[Test] Automation Control System - Verification',
    'Hello,\n\nThis is a test email from your Ticket Classification System to verify that SMTP email delivery is fully functional.\n\nIf you are reading this, your environment variables and email service are configured correctly!\n\nBest,\nAutomation Engine'
  );
  
  if (result.success) {
    console.log('Test email dispatched successfully!');
  } else {
    console.error('Failed to dispatch test email:', result.error);
  }
}

test();
