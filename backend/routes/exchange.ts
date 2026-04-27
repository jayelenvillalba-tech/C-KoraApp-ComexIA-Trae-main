/**
 * Exchange Rate Routes — Che.Comex
 * GET /api/exchange/rates       — All international rates (USD base)
 * GET /api/exchange/argentina   — 6 Argentine exchange rates
 * GET /api/exchange/convert     — Currency conversion
 */

import { Router, Request, Response } from 'express';
import { getExchangeRates, getArgentineRates, convertCurrency } from '../services/exchangeRate.js';

const router = Router();

// GET /api/exchange/rates
router.get('/rates', async (_req: Request, res: Response) => {
  try {
    const rates = await getExchangeRates();
    return res.json({ success: true, data: rates, source: 'ExchangeRate-API' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/exchange/argentina
router.get('/argentina', async (_req: Request, res: Response) => {
  try {
    const rates = await getArgentineRates();
    return res.json({ success: true, data: rates, source: 'DolarAPI' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/exchange/convert?from=USD&to=ARS&amount=450
router.get('/convert', async (req: Request, res: Response) => {
  try {
    const from   = (req.query.from   as string)?.toUpperCase() || 'USD';
    const to     = (req.query.to     as string)?.toUpperCase() || 'ARS';
    const amount = parseFloat(req.query.amount as string) || 1;

    const result = await convertCurrency(amount, from, to);
    return res.json({ success: true, from, to, amount, result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
