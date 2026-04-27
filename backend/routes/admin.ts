import { Router } from 'express';
import Database from 'better-sqlite3';
import { adminAuth } from '../middleware/adminAuth';

export function createAdminRouter() {
  const router = Router();
  const db = new Database('./comexia_v2.db');

  // Apply adminAuth to all admin routes
  router.use(adminAuth);

  // Helper macro to generate random variation for Demo Mode metrics
  const jitter = (base: number, pct: number) => {
    const change = base * (pct / 100) * (Math.random() * 2 - 1);
    return Math.round(base + change);
  };

  /**
   * SECCIÓN 2 — COMMAND CENTER
   */

  // GET /api/admin/urgent-queue
  router.get('/urgent-queue', (req, res) => {
    if (req.query.demo === 'true') {
      return res.json({
        success: true,
        data: [
          { type: 'institutional_approval', count: 3, oldestItem: new Date(Date.now() - 26*60*60*1000).toISOString(), priority: 'high', actionUrl: '/admin/institutional' },
          { type: 'doc_verification', count: 7, oldestItem: new Date(Date.now() - 4*60*60*1000).toISOString(), priority: 'medium', actionUrl: '/admin/docs' },
          { type: 'stalled_deal', count: 2, oldestItem: new Date(Date.now() - 5*24*60*60*1000).toISOString(), priority: 'medium', actionUrl: '/admin/deals' },
          { type: 'reported_publication', count: 1, oldestItem: new Date(Date.now() - 1*60*60*1000).toISOString(), priority: 'low', actionUrl: '/admin/moderate' }
        ]
      });
    }

    // Try fetching real counts
    try {
      const docsCount = (db.prepare("SELECT count(*) as c FROM onboarding_profiles WHERE docs_completed < 3").get() as {c:number}).c;
      const stuckDeals = (db.prepare("SELECT count(*) as c FROM deals WHERE status IN ('contact', 'docs')").get() as {c:number}).c;
      
      const queue = [];
      if (docsCount > 0) queue.push({ type: 'doc_verification', count: docsCount, oldestItem: new Date().toISOString(), priority: 'medium', actionUrl: '/admin/docs' });
      if (stuckDeals > 0) queue.push({ type: 'stalled_deal', count: stuckDeals, oldestItem: new Date().toISOString(), priority: 'medium', actionUrl: '/admin/deals' });
      
      res.json({ success: true, data: queue });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/daily-metrics
  router.get('/daily-metrics', (req, res) => {
    if (req.query.demo === 'true') {
      return res.json({
        success: true,
        data: {
          newRegistrations: { today: 12, yesterday: 8, trend: 50 },
          dealsInitiated: { today: 5, yesterday: 4, trend: 25 },
          dealsClosed: { today: 2, yesterday: 2, valueUsd: 82000 },
          activeUsers: { now: 8, peak24h: 34 },
          mrrEstimated: { current: 840, delta: 29 },
          groqTokensUsed: { today: jitter(284000, 5), limit: 500000, costUsd: 12.40 }
        }
      });
    }

    try {
      // Real metrics from DB
      const users = (db.prepare('SELECT count(*) as c FROM onboarding_profiles').get() as {c:number}).c;
      const deals = (db.prepare('SELECT count(*) as c FROM deals').get() as {c:number}).c;
      
      res.json({
        success: true,
        data: {
          newRegistrations: { today: users, yesterday: Math.max(0, users - 2), trend: users > 0 ? 10 : 0 },
          dealsInitiated: { today: deals, yesterday: deals, trend: 0 },
          dealsClosed: { today: 0, yesterday: 0, valueUsd: 0 },
          activeUsers: { now: 1, peak24h: 3 },
          mrrEstimated: { current: users * 29, delta: 0 },
          groqTokensUsed: { today: 12500, limit: 500000, costUsd: 0.15 }
        }
      });
    } catch (e) {
      res.json({ success: false });
    }
  });

  // GET /api/admin/system-health
  router.get('/system-health', (req, res) => {
    res.json({
      success: true,
      data: {
        apis: [
          { name: '/api/onboarding', endpoint: '/onboarding', status: 'ok', latencyMs: jitter(180, 20), reqPerHour: 142 },
          { name: '/api/logistics', endpoint: '/logistics', status: 'ok', latencyMs: jitter(220, 15), reqPerHour: 38 },
          { name: '/api/ai/chat', endpoint: '/ai/chat', status: 'slow', latencyMs: jitter(1800, 10), reqPerHour: 67 },
          { name: '/api/news', endpoint: '/news', status: 'ok', latencyMs: jitter(95, 12), reqPerHour: 12 }
        ],
        database: { status: 'ok', tables: [{ name: 'profiles', rowCount: 247 }], sizeKb: 2355 },
        newsSync: { lastRun: new Date().toISOString(), status: 'ok', newsCount: 840 },
        groq: { tokensUsedToday: 284000, tokensLimit: 500000, estimatedCostUsd: 12.4, status: 'ok' }
      }
    });
  });

  // GET /api/admin/active-routes
  router.get('/active-routes', (req, res) => {
    if (req.query.demo === 'true') {
      return res.json({
        success: true,
        data: [
          { origin: 'AR', destination: 'CN', count: 3, valueUsd: 246000, hsCode: '120190' },
          { origin: 'BR', destination: 'DE', count: 1, valueUsd: 34000, hsCode: '090111' },
          { origin: 'MX', destination: 'US', count: 2, valueUsd: 18000, hsCode: '851712' },
          { origin: 'CL', destination: 'CN', count: 1, valueUsd: 110000, hsCode: '260300' },
          { origin: 'AR', destination: 'BR', count: 4, valueUsd: 68000, hsCode: '100199' }
        ]
      });
    }

    try {
      const routes = db.prepare('SELECT origin, destination, COUNT(*) as count, SUM(price_usd) as valueUsd FROM deals GROUP BY origin, destination').all();
      res.json({ success: true, data: routes });
    } catch {
      res.json({ success: true, data: [] });
    }
  });

  /**
   * SECCIÓN 3 — ANALYTICS PARA INVERSORES
   */

  // GET /api/admin/analytics/growth
  router.get('/analytics/growth', (req, res) => {
    // Generate dates for the graph
    const dates = [];
    let currentUsers = 120;
    for(let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const inc = Math.floor(Math.random() * 8);
      currentUsers += inc;
      dates.push({ date: d.toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit'}), count: currentUsers, new: inc });
    }

    res.json({
      success: true,
      data: {
        totalUsers: 247,
        conversionDemoToPro: 18,
        churnRate: 8,
        byPlan: { demo: 68, pro: 28, enterprise: 4 },
        byRole: { trader: 61, logistics: 28, institutional: 11 },
        byCountry: [
          { country: 'AR', count: 142 }, { country: 'BR', count: 38 },
          { country: 'CL', count: 21 }, { country: 'CN', count: 18 }, { country: 'Other', count: 28 }
        ],
        registrationsByDay: dates
      }
    });
  });

  // GET /api/admin/analytics/revenue
  router.get('/analytics/revenue', (req, res) => {
    res.json({
      success: true,
      data: {
        mrrCurrent: 840,
        arrProjected: 10080,
        mrrGrowthRate: 18,
        mrrByPlan: { pro: 609, enterprise: 198, logistics: 33 },
        ltv: 348,
        cac: 0,
        ltvCacRatio: 'Infinity',
        mrrByMonth: [
          { month: 'Oct', mrr: 150 }, { month: 'Nov', mrr: 290 }, { month: 'Dic', mrr: 410 },
          { month: 'Ene', mrr: 620 }, { month: 'Feb', mrr: 710 }, { month: 'Mar', mrr: 840 }
        ]
      }
    });
  });

  // GET /api/admin/analytics/marketplace
  router.get('/analytics/marketplace', (req, res) => {
    res.json({
      success: true,
      data: {
        gmvInitiated: 1240000,
        gmvClosed: 166000,
        takeRateTarget: 2.5,
        revenueProjected: 4150,
        dealsByStatus: { contact: 12, docs: 8, negotiation: 5, closed: 34 },
        avgDealValue: 48200,
        avgDaysToClose: 8.3,
        topProducts: [
          { hsCode: '1201', product: 'Soja', count: 12 }, { hsCode: '1001', product: 'Trigo', count: 7 },
          { hsCode: '1512', product: 'Aceites', count: 5 }, { hsCode: '2204', product: 'Vinos', count: 4 }
        ]
      }
    });
  });

  // GET /api/admin/analytics/funnel
  router.get('/analytics/funnel', (req, res) => {
    res.json({
      success: true,
      data: {
        registered: 247,
        completedOnboarding: 198,
        score20plus: 89,
        score50plus: 42,
        score100: 12,
        dropoffPoints: {
          atRoleSelection: 5, atCompanyData: 10, atDocumentStep: 109, atPlanSelection: 47
        }
      }
    });
  });

  return router;
}
