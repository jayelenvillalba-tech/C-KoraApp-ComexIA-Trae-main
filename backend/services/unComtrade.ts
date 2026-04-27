/**
 * UN Comtrade API v2 Service — Che.Comex
 * Gratuita hasta 500 req/día — https://comtradeplus.un.org/Docs
 * Cache: SQLite (30 días TTL)
 */

import { getSqliteDb } from '../../database/db-sqlite.js';

const UN_COMTRADE_BASE = 'https://comtradeapi.un.org/data/v1/get';
const UN_COMTRADE_PUBLIC = 'https://comtradeapi.un.org/public/v1/preview/C/A/HS';

// ─── ISO Numeric codes para UN Comtrade ───────────────────────────────────────
export const COUNTRY_COMTRADE_CODES: Record<string, string> = {
  'AR': '032', 'AU': '036', 'AT': '040', 'BE': '056', 'BR': '076',
  'CA': '124', 'CL': '152', 'CN': '156', 'CO': '170', 'EG': '818',
  'FR': '250', 'DE': '276', 'IN': '356', 'ID': '360', 'IT': '380',
  'JP': '392', 'KR': '410', 'MY': '458', 'MX': '484', 'MA': '504',
  'NL': '528', 'NG': '566', 'PE': '604', 'PY': '600', 'SA': '682',
  'SG': '702', 'ZA': '710', 'ES': '724', 'TH': '764', 'AE': '784',
  'GB': '826', 'US': '840', 'UY': '858', 'VN': '704', 'UE': '097', // EU aggregate
};

export interface ComtradeResult {
  country: string;
  countryCode: string;
  countryCodeNumeric: string;
  tradeValueUsd: number;
  netWeightKg: number;
  year: number;
}

interface ComtradeParams {
  reporterCode: string;
  partnerCode?: string;
  cmdCode: string;
  period: string;
  flowCode: 'X' | 'M';
}

// ─── Cache helpers ────────────────────────────────────────────────────────────
const THIRTY_DAYS_S = 30 * 24 * 3600;

function getCached(key: string): any | null {
  const db = getSqliteDb();
  if (!db) return null;
  try {
    const now = Math.floor(Date.now() / 1000);
    const row = db.prepare(
      `SELECT data FROM comtrade_cache WHERE cache_key = ? AND expires_at > ?`
    ).get(key, now) as any;
    return row ? JSON.parse(row.data) : null;
  } catch { return null; }
}

function setCache(key: string, data: any): void {
  const db = getSqliteDb();
  if (!db) return;
  try {
    const now = Math.floor(Date.now() / 1000);
    db.prepare(
      `INSERT OR REPLACE INTO comtrade_cache (cache_key, data, created_at, expires_at)
       VALUES (?, ?, ?, ?)`
    ).run(key, JSON.stringify(data), now, now + THIRTY_DAYS_S);
  } catch (e) {
    console.error('[Comtrade] Cache write error:', e);
  }
}

// ─── API Call ─────────────────────────────────────────────────────────────────
async function callComtrade(params: ComtradeParams): Promise<any[]> {
  const hasKey = !!process.env.UN_COMTRADE_KEY;
  // Use public preview if no key, otherwise use the premium endpoint
  const baseUrl = hasKey ? UN_COMTRADE_BASE : UN_COMTRADE_PUBLIC;
  const url = new URL(baseUrl);
  
  if (hasKey) {
      url.searchParams.set('typeCode', 'C');
      url.searchParams.set('freqCode', 'A');
  }
  url.searchParams.set('reporterCode', params.reporterCode);
  url.searchParams.set('partnerCode', params.partnerCode || '0');
  url.searchParams.set('cmdCode', params.cmdCode);
  url.searchParams.set('period', params.period);
  url.searchParams.set('flowCode', params.flowCode);
  
  if (!hasKey) {
      // Public API limitations
      url.searchParams.set('customsCode', 'C00');
      url.searchParams.set('motCode', '0');
  } else {
      url.searchParams.set('format', 'JSON');
      url.searchParams.set('breakdownMode', 'classic');
  }

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (hasKey) {
    headers['Ocp-Apim-Subscription-Key'] = process.env.UN_COMTRADE_KEY!;
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    throw new Error(`UN Comtrade API error ${res.status}: ${await res.text()}`);
  }
  const json = await res.json() as any;
  return json?.data || [];
}

// ─── getTopBuyers ───────────────────────────────────────────────────────────
/**
 * Retorna los 10 principales países compradores de un producto.
 * @param hsCode   Código HS (4 ó 6 dígitos), ej. "120190"
 * @param reporterCountry Código ISO-2 del exportador, "AR" por defecto
 * @param year     Año o rango "2022,2023"
 */
export async function getTopBuyers(
  hsCode: string,
  reporterCountry = 'AR',
  year = '2023'
): Promise<ComtradeResult[]> {
  const reporterCode = COUNTRY_COMTRADE_CODES[reporterCountry] || '032';
  const cacheKey = `topbuyers:${reporterCode}:${hsCode}:${year}`;

  const cached = getCached(cacheKey);
  if (cached) {
    console.log(`[Comtrade] Cache HIT → ${cacheKey}`);
    return cached;
  }

  console.log(`[Comtrade] Cache MISS → fetching API: ${cacheKey}`);

  let rawData: any[];
  try {
    // Para la API pública, "0" retorna el agregado global. 
    // Para obtener "Top Buyers", pasamos una lista de códigos ISO numéricos de las economías más grandes.
    // China, USA, Brasil, India, Alemania, Japón, UK, Francia, España, Italia, etc.
    const hasKey = !!process.env.UN_COMTRADE_KEY;
    const partnerCode = hasKey ? 'all' : '156,840,076,356,276,392,826,250,724,380,124,410,152,484,764'; 

    rawData = await callComtrade({
      reporterCode,
      partnerCode,
      cmdCode: hsCode,
      period: year,
      flowCode: 'X',
    });
  } catch (err: any) {
    console.error('[Comtrade] API error, returning empty:', err.message);
    return [];
  }

  // Reverse-map numeric → ISO2
  const numericToIso2 = Object.fromEntries(
    Object.entries(COUNTRY_COMTRADE_CODES).map(([k, v]) => [v, k])
  );

  const results: ComtradeResult[] = rawData
    .map((d: any) => ({
      country: d.partnerDesc || d.partner || '',
      countryCode: numericToIso2[String(d.partnerCode)] || String(d.partnerCode),
      countryCodeNumeric: String(d.partnerCode),
      tradeValueUsd: d.primaryValue || d.tradeValueUSA || 0,
      netWeightKg: d.netWgt || d.qty || 0,
      year: d.period || parseInt(year),
    }))
    .filter((d) => d.countryCodeNumeric !== '0' && d.tradeValueUsd > 0)
    .sort((a, b) => b.tradeValueUsd - a.tradeValueUsd)
    .slice(0, 10);

  setCache(cacheKey, results);
  return results;
}

// ─── getTradeFlow ────────────────────────────────────────────────────────────
/**
 * Flujo bilateral específico entre dos países para un producto.
 */
export async function getTradeFlow(
  origin: string,
  destination: string,
  hsCode: string,
  year = '2023'
): Promise<{ valueUsd: number; weightKg: number; year: number }> {
  const reporterCode = COUNTRY_COMTRADE_CODES[origin] || '032';
  const partnerCode  = COUNTRY_COMTRADE_CODES[destination] || '0';
  const cacheKey = `flow:${reporterCode}:${partnerCode}:${hsCode}:${year}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const rawData = await callComtrade({
      reporterCode,
      partnerCode,
      cmdCode: hsCode,
      period: year,
      flowCode: 'X',
    });

    const result = {
      valueUsd: rawData[0]?.tradeValueUSA || 0,
      weightKg: rawData[0]?.netWgt || 0,
      year: rawData[0]?.period || parseInt(year),
    };
    setCache(cacheKey, result);
    return result;
  } catch (err: any) {
    console.error('[Comtrade] getTradeFlow error:', err.message);
    return { valueUsd: 0, weightKg: 0, year: parseInt(year) };
  }
}

// ─── checkRateLimit ───────────────────────────────────────────────────────────
/**
 * Verifica cuántas llamadas reales se hicieron hoy (aprox. vía cache MISS count).
 * Conservativo: si hay > 480 cache misses hoy, bloquear llamadas.
 */
export function isRateLimitSafe(): boolean {
  const db = getSqliteDb();
  if (!db) return false;
  try {
    const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
    const { count } = db.prepare(
      `SELECT COUNT(*) as count FROM comtrade_cache WHERE created_at > ?`
    ).get(todayStart) as any;
    return count < 480;
  } catch { return true; }
}
