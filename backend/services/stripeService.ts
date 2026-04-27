import { logger } from '../services/logger.js';
import { sendWelcomeEmail } from './emailService.js';
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'comexia_v2.db'));

async function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  try {
    const Stripe = (await import('stripe')).default;
    return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' as any });
  } catch {
    return null;
  }
}

const STRIPE_PRICE_IDS: Record<string, string> = {
  pro: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
  partner_pro: process.env.STRIPE_PRICE_PARTNER_PRO || '',
};

export async function createCheckoutSession(
  userId: string, plan: string,
  successUrl: string, cancelUrl: string
): Promise<string> {
  const stripe = await getStripe();
  if (!stripe) throw new Error('Stripe not configured');

  const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId) as any;
  const priceId = STRIPE_PRICE_IDS[plan];
  if (!priceId) throw new Error(`Plan ${plan} no configurado en Stripe`);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: user?.email,
    metadata: { userId, plan },
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    locale: 'es-419' as any,
    allow_promotion_codes: true,
  });

  return session.url!;
}

export async function createBillingPortal(
  userId: string, returnUrl: string
): Promise<string> {
  const stripe = await getStripe();
  if (!stripe) throw new Error('Stripe not configured');

  const sub = db.prepare(
    "SELECT stripe_customer_id FROM subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1"
  ).get(userId) as any;

  if (!sub?.stripe_customer_id) throw new Error('Sin suscripción activa');

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: returnUrl,
  });
  return session.url;
}

export async function handleStripeWebhook(
  payload: Buffer, signature: string
): Promise<void> {
  const stripe = await getStripe();
  if (!stripe) throw new Error('Stripe not configured');

  const event = stripe.webhooks.constructEvent(
    payload, signature, process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      const { userId, plan } = session.metadata || {};
      if (userId && plan) {
        try {
          db.prepare(`
            INSERT OR REPLACE INTO subscriptions
              (user_id, plan, status, stripe_customer_id, stripe_subscription_id,
               started_at, current_period_end)
            VALUES (?, ?, 'active', ?, ?, strftime('%s','now'), ?)
          `).run(userId, plan, session.customer, session.subscription,
            Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60);
        } catch (e) {
          logger.error('[stripe] webhook DB error', { error: (e as Error).message });
        }
        sendWelcomeEmail(userId, plan).catch(() => {});
      }
      break;
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as any;
      db.prepare(
        'UPDATE subscriptions SET status = \'active\', current_period_end = ? WHERE stripe_subscription_id = ?'
      ).run(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, invoice.subscription);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as any;
      db.prepare(
        "UPDATE subscriptions SET status = 'past_due' WHERE stripe_subscription_id = ?"
      ).run(invoice.subscription);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as any;
      db.prepare(
        "UPDATE subscriptions SET status = 'cancelled' WHERE stripe_subscription_id = ?"
      ).run(sub.id);
      const record = db.prepare(
        'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?'
      ).get(sub.id) as any;
      if (record?.user_id) {
        db.prepare("UPDATE users SET role = 'demo' WHERE id = ?").run(record.user_id);
      }
      break;
    }
  }
}
