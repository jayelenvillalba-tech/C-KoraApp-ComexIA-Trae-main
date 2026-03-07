import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { IUser } from '../models/User';

dotenv.config();

class NotificationService {
  private transporter: nodemailer.Transporter;
  private readonly fromEmail: string;

  constructor() {
    this.fromEmail = process.env.GMAIL_USER || 'noreply@comexia.com';
    
    // Configure Gmail SMTP
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  /**
   * Send Welcome Email to new users
   */
  async sendWelcomeEmail(user: IUser) {
    if (!user.email) return;

    const subject = `Welcome to ComexIA, ${user.name}!`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #2563eb;">Welcome to ComexIA! 🌍</h1>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>We are thrilled to match you with global trade opportunities.</p>
        <p>Here is how to get started:</p>
        <ul>
          <li><strong>Complete your Profile:</strong> Add your interested HS Codes.</li>
          <li><strong>Explore Marketplace:</strong> See what's trading now.</li>
          <li><strong>Use AI Tools:</strong> Classify products instantly.</li>
        </ul>
        <p>Go to <a href="http://localhost:5173/">ComexIA Dashboard</a></p>
        <p>Best regards,<br>The ComexIA Team</p>
      </div>
    `;

    await this.sendEmail(user.email, subject, html);
  }

  /**
   * Send Alert for New Opportunity matching User's HS Codes
   */
  async sendNewOpportunityAlert(post: any, user: IUser) {
    if (!user.email) return;

    const subject = `🎯 New Opportunity: ${post.productName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #16a34a;">New Trade Opportunity Found!</h2>
        <p>Hello ${user.name},</p>
        <p>A new listing matches your interest in <strong>HS Code ${post.hsCode}</strong>.</p>
        
        <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color: #f9fafb;">
          <p><strong>Product:</strong> ${post.productName}</p>
          <p><strong>Origin:</strong> ${post.originCountry}</p>
          <p><strong>Type:</strong> ${post.type}</p>
          <p><strong>Price:</strong> ${post.currency} ${post.price}</p>
        </div>

        <p><a href="http://localhost:5173/marketplace" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Opportunity</a></p>
      </div>
    `;

    await this.sendEmail(user.email, subject, html);
  }

  /**
   * Send Critical Error Alert to Admin
   */
  async sendCriticalErrorAlert(error: any) {
    const adminEmail = process.env.GMAIL_USER; // Send to self for now
    if (!adminEmail) return;

    const subject = `🚨 CRITICAL ERROR: ComexIA Backend`;
    const html = `
      <div style="font-family: monospace; color: #b91c1c;">
        <h1>CRITICAL SYSTEM ERROR</h1>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Error:</strong> ${error.message || error}</p>
        <pre style="background: #fef2f2; padding: 10px; border: 1px solid #fecaca;">${error.stack || 'No stack trace'}</pre>
      </div>
    `;

    await this.sendEmail(adminEmail, subject, html);
  }

  private async sendEmail(to: string, subject: string, html: string) {
    try {
      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.warn('⚠️ Email credentials missing in .env. Skipping email.');
        return;
      }

      await this.transporter.sendMail({
        from: `"ComexIA AI" <${this.fromEmail}>`,
        to,
        subject,
        html,
      });
      console.log(`✅ Email sent to ${to}: ${subject}`);
    } catch (err) {
      console.error(`❌ Failed to send email to ${to}:`, err);
    }
  }
}

export const notificationService = new NotificationService();
