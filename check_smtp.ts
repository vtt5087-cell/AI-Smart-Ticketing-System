import nodemailer from 'nodemailer';
import { config } from 'dotenv';
config();

async function check() {
  console.log('--- SMTP Configuration Check ---');
  console.log('SMTP_SERVER:', process.env.SMTP_SERVER || 'Not set (defaults to smtp.gmail.com)');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || 'Not set (defaults to 587)');
  console.log('SMTP_USERNAME:', process.env.SMTP_USERNAME ? 'Set' : 'Not Set');
  console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'Set' : 'Not Set');
  console.log('FROM_EMAIL:', process.env.FROM_EMAIL || 'Not set');

  const pass = process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.replace(/\s+/g, '') : undefined;

  if (!process.env.SMTP_USERNAME || !pass) {
    console.log('Error: Missing SMTP_USERNAME or SMTP_PASSWORD.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: pass,
    },
  });

  try {
    console.log('\nTesting SMTP Connection...');
    await transporter.verify();
    console.log('✅ SMTP Connection Successful! The server is ready to send messages.');
  } catch (error) {
    console.error('❌ SMTP Connection Failed:');
    console.error(error);
  }
}

check();
