import { Router } from 'express';
import { createCheckoutSession, createBillingPortal, handleStripeWebhook } from '../services/stripeService.js';
import { createMpPreference, handleMpWebhook } from '../services/mercadopagoService.js';
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'comexia_v2.db'));
const router = Router();

// Auth middleware (inline — avoids import issues)
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_key_123';
function authenticateToken(req: any, res: any, next: any) {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// ── STRIPE ────────────────────────────────────────────────────────

// CRITICAL: stripe webhook must use raw body — register via express.raw in server.ts
// Here we just handle the parsed body passed from main server
router.post('/stripe/webhook-handler', async (req, res) => {
  const signature = req.headers['stripe-signature'] as string;
  try {
    await handleStripeWebhook(req.body, signature);
    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: 'Webhook inválido' });
  }
});

router.post('/stripe/checkout', authenticateToken, async (req, res) => {
  const { plan } = req.body;
  const userId = (req as any).user?.userId;
  const origin = req.headers.origin || 'http://localhost:5174';

  try {
    const url = await createCheckoutSession(
      userId, plan,
      `${origin}/subscription/success`,
      `${origin}/subscription/cancel`
    );
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: 'Error creando sesión de pago. Verificar configuración de Stripe.' });
  }
});

router.post('/stripe/portal', authenticateToken, async (req, res) => {
  const userId = (req as any).user?.userId;
  const origin = req.headers.origin || 'http://localhost:5174';
  try {
    const url = await createBillingPortal(userId, `${origin}/settings`);
    res.json({ url });
  } catch {
    res.status(400).json({ error: 'No hay suscripción activa' });
  }
});

// ── MERCADOPAGO ───────────────────────────────────────────────────

router.post('/mp/preference', authenticateToken, async (req, res) => {
  const { plan } = req.body;
  const userId = (req as any).user?.userId;
  const origin = req.headers.origin || 'http://localhost:5174';
  try {
    const result = await createMpPreference(
      userId, plan,
      `${origin}/subscription/success`,
      `${origin}/subscription/cancel`
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error creando preferencia de MercadoPago.' });
  }
});

router.post('/mp/webhook', async (req, res) => {
  const { type, data } = req.body;
  if (type === 'payment' && data?.id) {
    await handleMpWebhook(data.id, req.body.status || 'pending', req.body.external_reference || '');
  }
  res.json({ received: true });
});

// ── STATUS & PLANS ───────────────────────────────────────────────

router.get('/status', authenticateToken, (req, res) => {
  const userId = (req as any).user?.userId;
  try {
    const sub = db.prepare(
      "SELECT plan, status, current_period_end FROM subscriptions WHERE user_id = ? AND status IN ('active','past_due') ORDER BY started_at DESC LIMIT 1"
    ).get(userId) as any;
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;

    res.json({
      plan: user?.role || 'demo',
      subscriptionStatus: sub?.status || null,
      currentPeriodEnd: sub?.current_period_end || null,
      isActive: sub?.status === 'active',
    });
  } catch {
    res.json({ plan: 'demo', subscriptionStatus: null, currentPeriodEnd: null, isActive: false });
  }
});

router.get('/plans', (req, res) => {
  // Detect country from auth header if present
  let isLatam = false;
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId) as any;
      isLatam = ['AR','BR','CL','UY','PY','PE','CO','MX'].includes(user?.country || '');
    } catch { /* no auth required for plans */ }
  }

  res.json({
    currency: isLatam ? 'ARS' : 'USD',
    paymentMethod: isLatam ? 'mercadopago' : 'stripe',
    note: isLatam
      ? 'Procesado por MercadoPago. Precios en ARS.'
      : 'Processed by Stripe. Prices in USD.',
    plans: [
      { id: 'demo', name: 'Demo', priceUsd: 0, priceArs: 0, features: ['10 búsquedas/mes', '1 ruta de análisis', 'Sin marketplace'], cta: 'Plan actual' },
      {
        id: 'pro', name: 'Pro PyME', priceUsd: 29, priceArs: 34423,
        features: ['Búsquedas ilimitadas', 'Análisis de rutas completo', 'Marketplace B2B', 'Chat corporativo', 'Documentos de ruta', 'Soporte por email'],
        cta: isLatam ? 'Suscribirse con MercadoPago' : 'Subscribe with Card',
        highlighted: true,
      },
      {
        id: 'enterprise', name: 'Enterprise', priceUsd: 99, priceArs: 117513,
        features: ['Todo Pro PyME', 'Multi-usuario', 'API access', 'Soporte prioritario', 'Informes personalizados', 'Onboarding dedicado'],
        cta: isLatam ? 'Contratar Enterprise' : 'Go Enterprise',
      },
    ],
  });
});

// ── MÓDULO INFORMATIVO: INSTRUMENTOS DE PAGO COMERCIAL ────────────
// Che.Comex NO procesa pagos de deals — informa sobre los instrumentos reales

router.get('/trade-instruments', (req, res) => {
  res.json({
    disclaimer: 'Che.Comex no procesa pagos comerciales entre empresas. Esta información es orientativa. Consultar con tu banco y despachante.',
    instruments: [
      {
        id: 'letter_of_credit',
        name: 'Carta de Crédito (L/C)',
        nameEn: 'Letter of Credit',
        whenToUse: 'Operaciones de alto valor con compradores nuevos. Máxima seguridad para el vendedor.',
        cost: '1-3% del valor de la operación',
        processingDays: '3-7 días bancarios',
        protectsWho: 'Ambas partes',
        risk: 'Bajo',
        learnMore: 'https://www.icc.org/resources/letter-of-credit',
      },
      {
        id: 'wire_transfer',
        name: 'Transferencia Bancaria SWIFT (T/T)',
        nameEn: 'Wire Transfer',
        whenToUse: 'Compradores conocidos. Modalidad frecuente: 30% adelanto + 70% contra documentos.',
        cost: 'USD 20-50 por transferencia',
        processingDays: '1-3 días hábiles',
        protectsWho: 'Depende de la modalidad',
        risk: 'Medio',
        learnMore: null,
      },
      {
        id: 'documentary_collection',
        name: 'Cobranza Documentaria',
        nameEn: 'Documentary Collection',
        whenToUse: 'Compradores semi-conocidos. Más barata que L/C.',
        cost: '0.1-0.3% del valor',
        processingDays: '5-15 días',
        protectsWho: 'Principalmente el vendedor',
        risk: 'Medio-bajo',
        learnMore: 'https://www.icc.org/resources/documentary-collections',
      },
      {
        id: 'open_account',
        name: 'Cuenta Abierta',
        nameEn: 'Open Account',
        whenToUse: 'Solo con compradores con historial probado. Común en MERCOSUR.',
        cost: 'Sin costo bancario adicional',
        processingDays: 'Según acuerdo (30/60/90 días)',
        protectsWho: 'Solo el comprador',
        risk: 'Alto para el vendedor',
        learnMore: null,
      },
    ],
    discrepancyWarning: {
      title: 'Prevención de discrepancias documentales',
      description: 'El 40% de las cartas de crédito presentan discrepancias, lo que puede demorar el cobro 15-45 días.',
      commonErrors: [
        'Nombre de empresa diferente en factura vs certificado de origen',
        'Valor FOB no coincide entre factura y Permiso de Embarque',
        'NCM declarado diferente en distintos documentos',
        'Certificado de Origen vencido o emitido por organismo no habilitado',
        'Bill of Lading con fecha posterior al vencimiento de la L/C',
      ],
    },
  });
});

export default router;
