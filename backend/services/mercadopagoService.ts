import { logger } from '../services/logger.js';
import { sendWelcomeEmail } from './emailService.js';
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'comexia_v2.db'));

// Precios en ARS — actualizar mensualmente según tipo de cambio oficial
const PLAN_PRICES_ARS: Record<string, { title: string; ars: number }> = {
  pro: { title: 'Che.Comex Pro PyME — Suscripción mensual', ars: 34423 },
  enterprise: { title: 'Che.Comex Enterprise — Suscripción mensual', ars: 117513 },
  partner_pro: { title: 'Che.Comex Partner Pro — Suscripción mensual', ars: 58121 },
};

export async function createMpPreference(
  userId: string, plan: string,
  successUrl: string, failureUrl: string
): Promise<{ initPoint: string; preferenceId: string }> {
  if (!process.env.MP_ACCESS_TOKEN) throw new Error('MercadoPago not configured');

  const { MercadoPagoConfig, Preference } = await import('mercadopago');
  const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

  const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId) as any;
  const planData = PLAN_PRICES_ARS[plan];
  if (!planData) throw new Error(`Plan ${plan} no existe`);

  const preference = new Preference(mpClient);
  const result = await preference.create({
    body: {
      items: [{
        id: `checomex_${plan}`,
        title: planData.title,
        quantity: 1,
        unit_price: planData.ars,
        currency_id: 'ARS',
      }],
      payer: { email: user?.email || '', name: user?.name || '' },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: successUrl,
      },
      auto_return: 'approved',
      external_reference: `${userId}:${plan}`,
      statement_descriptor: 'CHECOMEX',
    },
  });

  return { initPoint: result.init_point!, preferenceId: result.id! };
}

export async function handleMpWebhook(
  paymentId: string, status: string, externalRef: string
): Promise<void> {
  if (status !== 'approved') return;

  const [userId, plan] = (externalRef || '').split(':');
  if (!userId || !plan) return;

  try {
    db.prepare(`
      INSERT OR REPLACE INTO subscriptions
        (user_id, plan, status, mp_payment_id, started_at, current_period_end)
      VALUES (?, ?, 'active', ?, strftime('%s','now'), ?)
    `).run(userId, plan, paymentId,
      Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60);

    sendWelcomeEmail(userId, plan).catch(() => {});
    logger.info('[mp] Suscripción activada', { userId, plan });
  } catch (error) {
    logger.error('[mp] webhook DB error', { error: (error as Error).message });
  }
}
