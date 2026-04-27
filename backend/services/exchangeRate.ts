/**
 * Exchange Rate Service — Che.Comex
 * ExchangeRate-API  → gratuita hasta 1500 req/mes (plan free)
 * DolarAPI (AR)     → gratuita, sin límite — https://dolarapi.com
 * Cache: SQLite (1h divisas internacionales, 15min AR)
 */

import { getSqliteDb } from '../../database/db-sqlite.js';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;  // ISO string
}

export interface ArgentineRates {
  oficial: number;
  blue: number;
  mep: number;
  ccl: number;
  tarjeta: number;
  mayorista: number;
  lastUpdated: string;
}

// In-memory micro-cache to avoid even SQLite roundtrips for hot paths
let _ratesMemCache: ExchangeRates | null = null;
let _ratesCacheTime = 0;
let _arRatesMemCache: ArgentineRates | null = null;
let _arCacheTime = 0;

const ONE_HOUR_MS    = 60 * 60 * 1000;
const FIFTEEN_MIN_MS = 15 * 60 * 1000;

// ─── SQLite helpers ───────────────────────────────────────────────────────────
function getPairFromDb(pair: string): number | null {
  const db = getSqliteDb();
  if (!db) return null;
  try {
    const oneHourAgo = Math.floor((Date.now() - ONE_HOUR_MS) / 1000);
    const row = db.prepare(
      `SELECT rate FROM exchange_cache WHERE currency_pair = ? AND updated_at > ?`
    ).get(pair, oneHourAgo) as any;
    return row?.rate ?? null;
  } catch { return null; }
}

function setPairInDb(pair: string, rate: number): void {
  const db = getSqliteDb();
  if (!db) return;
  try {
    const now = Math.floor(Date.now() / 1000);
    db.prepare(
      `INSERT OR REPLACE INTO exchange_cache (currency_pair, rate, updated_at) VALUES (?, ?, ?)`
    ).run(pair, rate, now);
  } catch (e) {
    console.error('[Exchange] DB write error:', e);
  }
}

// ─── International rates (ExchangeRate-API) ───────────────────────────────────
export async function getExchangeRates(): Promise<ExchangeRates> {
  // 1. Memory cache
  if (_ratesMemCache && Date.now() - _ratesCacheTime < ONE_HOUR_MS) {
    return _ratesMemCache;
  }

  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY || '';
    const url = apiKey
      ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
      : `https://api.exchangerate-api.com/v4/latest/USD`;

    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`ExchangeRate API ${res.status}`);

    const data = await res.json() as any;

    const rates: Record<string, number> = data.rates || data.conversion_rates || {};

    // Persist pairs we care about
    const IMPORTANT_PAIRS = ['ARS', 'BRL', 'EUR', 'GBP', 'CNY', 'CLP', 'PEN', 'UYU', 'MXN', 'COP'];
    for (const cur of IMPORTANT_PAIRS) {
      if (rates[cur]) setPairInDb(`USD-${cur}`, rates[cur]);
    }

    const result: ExchangeRates = {
      base: 'USD',
      rates,
      lastUpdated: new Date().toISOString(),
    };

    _ratesMemCache = result;
    _ratesCacheTime = Date.now();
    return result;

  } catch (err: any) {
    console.warn('[Exchange] API failed, trying DB cache:', err.message);
    // Fallback: build rates from DB
    try {
      const db = getSqliteDb();
      if (db) {
        const rows = db.prepare(`SELECT currency_pair, rate FROM exchange_cache`).all() as any[];
        const rates: Record<string, number> = {};
        for (const row of rows) {
          const [, to] = row.currency_pair.split('-');
          if (to) rates[to] = row.rate;
        }
        if (Object.keys(rates).length > 0) {
          return { base: 'USD', rates, lastUpdated: 'cached' };
        }
      }
    } catch (dbErr) {
      console.warn('[Exchange] DB fallback also failed:', dbErr);
    }
    // Last resort: hardcoded approximate values
    return {
      base: 'USD',
      rates: { ARS: 1187, BRL: 5.85, EUR: 0.92, GBP: 0.79, CNY: 7.24, CLP: 910, PEN: 3.72, UYU: 39.1, MXN: 17.2, COP: 4100 },
      lastUpdated: 'approximate',
    };
  }
}

// ─── Argentine-specific rates (DolarAPI) ─────────────────────────────────────
export async function getArgentineRates(): Promise<ArgentineRates> {
  // Memory cache — 15 min
  if (_arRatesMemCache && Date.now() - _arCacheTime < FIFTEEN_MIN_MS) {
    return _arRatesMemCache;
  }

  try {
    const res = await fetch('https://dolarapi.com/v1/dolares', {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`DolarAPI ${res.status}`);

    const data = await res.json() as any[];

    // DolarAPI returns array: [{ casa: "oficial", compra: 1180, venta: 1187 }, ...]
    const find = (casa: string) => {
      const item = data.find((d: any) =>
        d.casa?.toLowerCase() === casa.toLowerCase()
      );
      return item ? (item.venta ?? item.compra) : 0;
    };

    const oficial = find('oficial');

    const result: ArgentineRates = {
      oficial,
      blue:       find('blue'),
      mep:        find('bolsa'),
      ccl:        find('contadoconliqui'),
      tarjeta:    oficial > 0 ? +(oficial * 1.75).toFixed(2) : 0,  // oficial + 30% PAIS + 45% percepción
      mayorista:  find('mayorista'),
      lastUpdated: new Date().toISOString(),
    };

    // Persist in DB
    const db = getSqliteDb();
    if (db) {
      const now = Math.floor(Date.now() / 1000);
      const pairs = [
        ['USD-ARS-oficial',    result.oficial],
        ['USD-ARS-blue',       result.blue],
        ['USD-ARS-mep',        result.mep],
        ['USD-ARS-ccl',        result.ccl],
        ['USD-ARS-tarjeta',    result.tarjeta],
        ['USD-ARS-mayorista',  result.mayorista],
      ];
      const stmt = db.prepare(
        `INSERT OR REPLACE INTO exchange_cache (currency_pair, rate, updated_at) VALUES (?, ?, ?)`
      );
      for (const [pair, rate] of pairs) {
        try { stmt.run(pair, rate, now); } catch {}
      }
    }

    _arRatesMemCache = result;
    _arCacheTime = Date.now();
    return result;

  } catch (err: any) {
    console.warn('[DolarAPI] Failed, using DB cache:', err.message);

    try {
      const db = getSqliteDb();
      if (db) {
        const rows = db.prepare(
          `SELECT currency_pair, rate FROM exchange_cache WHERE currency_pair LIKE 'USD-ARS-%'`
        ).all() as any[];
        const map: Record<string, number> = {};
        for (const r of rows) map[r.currency_pair] = r.rate;

        if (map['USD-ARS-oficial']) {
          return {
            oficial:    map['USD-ARS-oficial'] ?? 0,
            blue:       map['USD-ARS-blue'] ?? 0,
            mep:        map['USD-ARS-mep'] ?? 0,
            ccl:        map['USD-ARS-ccl'] ?? 0,
            tarjeta:    map['USD-ARS-tarjeta'] ?? 0,
            mayorista:  map['USD-ARS-mayorista'] ?? 0,
            lastUpdated: 'cached',
          };
        }
      }
    } catch (dbErr) {
      console.warn('[DolarAPI] DB fallback also failed:', dbErr);
    }

    // Absolute fallback
    return { oficial: 1187, blue: 1245, mep: 1198, ccl: 1215, tarjeta: 1899, mayorista: 1183, lastUpdated: 'approximate' };
  }
}

// ─── convertCurrency ──────────────────────────────────────────────────────────
export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  if (from === to) return amount;

  const rates = await getExchangeRates();

  // Convert via USD as base
  let amountInUsd = amount;
  if (from !== 'USD') {
    const fromRate = rates.rates[from];
    if (!fromRate) return amount;
    amountInUsd = amount / fromRate;
  }

  const toRate = rates.rates[to];
  if (!toRate) return amountInUsd;
  return Math.round(amountInUsd * toRate * 100) / 100;
}
