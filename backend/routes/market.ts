/**
 * Market Routes — Che.Comex
 * GET /api/market/top-buyers  — UN Comtrade top importers
 * GET /api/market/trade-flow  — bilateral trade value
 * POST /api/market/seed-cache — preload common products into cache
 */

import { Router, Request, Response } from 'express';
import { getTopBuyers, getTradeFlow, isRateLimitSafe } from '../services/unComtrade.js';
import { analyzePriceVsMarket } from '../services/usdaAms.js';

const router = Router();

// Normalize HS code: remove dots, ensure 6 digits
const normalizeHs = (raw: string): string => raw.replace(/\./g, '').substring(0, 6);

// GET /api/market/top-buyers?hsCode=120190&country=AR&year=2023
router.get('/top-buyers', async (req: Request, res: Response) => {
  try {
    const rawHs    = (req.query.hsCode as string) || '';
    const hsCode   = normalizeHs(rawHs);
    const country  = ((req.query.country  as string) || 'AR').replace('Argentina', 'AR').replace('Brasil', 'BR');
    const year     = (req.query.year      as string) || '2023';

    if (!hsCode) {
      return res.status(400).json({ success: false, error: 'hsCode is required' });
    }

    if (!isRateLimitSafe()) {
      return res.status(429).json({
        success: false,
        error: 'Daily UN Comtrade API limit reached. Try again tomorrow.',
        source: 'rate-limit',
      });
    }

    const buyers = await getTopBuyers(hsCode, country, year);

    return res.json({
      success: true,
      hsCode,
      reporterCountry: country,
      year,
      total: buyers.length,
      data: buyers,
      source: 'UN Comtrade',
      note: 'Fuente: UN Comtrade — datos reales de comercio internacional.',
    });
  } catch (err: any) {
    console.error('[market/top-buyers]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/market/trade-flow?origin=AR&destination=CN&hsCode=120190&year=2023
router.get('/trade-flow', async (req: Request, res: Response) => {
  try {
    const origin      = (req.query.origin      as string) || 'AR';
    const destination = (req.query.destination as string) || 'CN';
    const hsCode      = (req.query.hsCode      as string) || '';
    const year        = (req.query.year        as string) || '2023';

    if (!hsCode) {
      return res.status(400).json({ success: false, error: 'hsCode is required' });
    }

    const flow = await getTradeFlow(origin, destination, hsCode, year);

    return res.json({
      success: true,
      origin,
      destination,
      hsCode,
      year,
      data: flow,
      source: 'UN Comtrade',
    });
  } catch (err: any) {
    console.error('[market/trade-flow]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/market/seed-cache — Preload top AR export products into cache
const COMMON_PRODUCTS = [
  { hsCode: '120190', name: 'Soja' },
  { hsCode: '100199', name: 'Trigo' },
  { hsCode: '100590', name: 'Maíz' },
  { hsCode: '150710', name: 'Aceite de Soja' },
  { hsCode: '230400', name: 'Harina de Soja' },
  { hsCode: '220421', name: 'Vino' },
  { hsCode: '020130', name: 'Carne bovina' },
  { hsCode: '740311', name: 'Cobre' },
  { hsCode: '260111', name: 'Mineral de hierro' },
  { hsCode: '270900', name: 'Petróleo crudo' },
];

router.post('/seed-cache', async (req: Request, res: Response) => {
  res.json({ message: 'Seed iniciado en background', products: COMMON_PRODUCTS.length });

  // Run in background — do not await
  (async () => {
    for (const p of COMMON_PRODUCTS) {
      try {
        if (!isRateLimitSafe()) break;
        await getTopBuyers(p.hsCode, 'AR', '2023');
        console.log(`[seed-cache] ✅ ${p.name} (${p.hsCode})`);
        // Small delay between requests to avoid rate limit
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e: any) {
        console.warn(`[seed-cache] ⚠️ ${p.name}: ${e.message}`);
      }
    }
    console.log('[seed-cache] 🎉 Pre-loading complete');
  })();
});


// GET /api/market/price-analysis?hsCode=120190&price=450
// Phase 33: Price vs market reference (USDA AMS / BCR Rosario fallback)
router.get('/price-analysis', async (req: Request, res: Response) => {
  const { hsCode, price } = req.query;
  if (!hsCode || !price) return res.status(400).json({ error: 'hsCode y price requeridos' });

  try {
    const analysis = await analyzePriceVsMarket(parseFloat(price as string), hsCode as string);
    res.json({ success: true, hsCode, offeredPrice: parseFloat(price as string), ...analysis });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
