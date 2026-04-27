/**
 * WTO Tariff Service — Che.Comex
 * WTO Tariff Download Facility — gratuita
 * Base: https://tariffdata.wto.org/api
 * Cache SQLite: 90 días TTL
 */

import { getSqliteDb } from '../../database/db-sqlite.js';
import { countries as countriesData } from '../../shared/countries-data.js';

const NINETY_DAYS_S = 90 * 24 * 3600;

export interface TariffResult {
  reporterCountry: string;
  exporterCountry: string;
  hsCode: string;
  mfnRate: number;
  preferentialRate?: number;
  treatyName?: string;
  effectiveRate: number;
  source: 'api' | 'cache' | 'fallback';
}

// ─── Cache helpers ────────────────────────────────────────────────────────────
function getCached(key: string): Omit<TariffResult, 'source'> | null {
  const db = getSqliteDb();
  if (!db) return null;
  try {
    const now = Math.floor(Date.now() / 1000);
    const row = db.prepare(
      `SELECT mfn_rate, preferential_rate, treaty_name, effective_rate
       FROM tariff_cache WHERE cache_key = ? AND expires_at > ?`
    ).get(key, now) as any;
    if (!row) return null;
    return {
      mfnRate: row.mfn_rate,
      preferentialRate: row.preferential_rate ?? undefined,
      treatyName: row.treaty_name ?? undefined,
      effectiveRate: row.effective_rate,
      reporterCountry: '',
      exporterCountry: '',
      hsCode: '',
    };
  } catch { return null; }
}

function setCache(key: string, data: TariffResult): void {
  const db = getSqliteDb();
  if (!db) return;
  try {
    const now = Math.floor(Date.now() / 1000);
    db.prepare(
      `INSERT OR REPLACE INTO tariff_cache
       (cache_key, mfn_rate, preferential_rate, treaty_name, effective_rate, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      key,
      data.mfnRate,
      data.preferentialRate ?? null,
      data.treatyName ?? null,
      data.effectiveRate,
      now,
      now + NINETY_DAYS_S
    );
  } catch (e) {
    console.error('[WTO] Cache write error:', e);
  }
}

// ─── Treaty detection from countries-data ────────────────────────────────────
function detectTreaty(importerCode: string, exporterCode: string): { name: string; reduction: number } | null {
  const importer = countriesData.find(c => c.code === importerCode);
  const exporter = countriesData.find(c => c.code === exporterCode);
  if (!importer || !exporter) return null;

  const sharedTreaties = importer.treaties?.filter(t => exporter.treaties?.includes(t)) || [];
  if (sharedTreaties.length === 0) return null;

  // Prioridad de reducción arancelaria por bloque
  const TREATY_REDUCTIONS: Record<string, { name: string; reduction: number }> = {
    'mercosur':   { name: 'MERCOSUR (ACE-18)',     reduction: 100 },
    'eu':         { name: 'MERCOSUR-UE (en vigor futura)', reduction: 20 },
    'usmca':      { name: 'USMCA',                 reduction: 100 },
    'cptpp':      { name: 'CPTPP',                 reduction: 85  },
    'rcep':       { name: 'RCEP',                  reduction: 70  },
    'ace35':      { name: 'ACE-35 (AR-CL)',         reduction: 100 },
    'ace58':      { name: 'ACE-58 (MERCOSUR-PE)',   reduction: 90  },
    'aladi':      { name: 'ALADI',                  reduction: 40  },
    'sgp':        { name: 'SGP Preferencial',       reduction: 30  },
    'asean':      { name: 'ASEAN',                  reduction: 80  },
  };

  for (const t of sharedTreaties) {
    const tLower = t.toLowerCase();
    for (const [key, val] of Object.entries(TREATY_REDUCTIONS)) {
      if (tLower.includes(key)) return val;
    }
  }

  return { name: `Acuerdo bilateral`, reduction: 25 };
}

// ─── WTO API call ─────────────────────────────────────────────────────────────
async function fetchWTOTariff(importerCode: string, hsCode: string): Promise<number | null> {
  try {
    // WTO Tariff API endpoint
    const url = `https://tariffdata.wto.org/api/Mfn/GetMfnAppliedTariffByImporterAndHscode/${importerCode}/${hsCode}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    // WTO returns array of duty records; take the most recent applied rate
    if (Array.isArray(data) && data.length > 0) {
      const sorted = data.sort((a: any, b: any) => b.Year - a.Year);
      return sorted[0]?.DutyRate ?? null;
    }
    return null;
  } catch (err: any) {
    console.warn('[WTO] API fetch failed:', err.message);
    return null;
  }
}

// ─── Fallback MFN rates by HS chapter ─────────────────────────────────────────
const FALLBACK_MFN_BY_CHAPTER: Record<string, number> = {
  '01': 0,   '02': 26.5, '03': 10,   '04': 20,   '05': 5,
  '06': 6.5, '07': 10,   '08': 8,    '09': 12,   '10': 10,
  '11': 15,  '12': 6,    '15': 15,   '16': 21,   '23': 10,
  '24': 22,  '27': 0,    '28': 6.5,  '29': 6.5,  '30': 4,
  '41': 7.5, '48': 9,    '62': 12,   '64': 17,   '71': 0,
  '72': 6,   '74': 3,    '76': 6,    '84': 1.7,  '85': 2.1,
  '87': 6.5, '90': 2,    '93': 0,
};

function getFallbackRate(hsCode: string): number {
  const chapter = hsCode.substring(0, 2);
  return FALLBACK_MFN_BY_CHAPTER[chapter] ?? 10;
}

// ─── Main export ──────────────────────────────────────────────────────────────
/**
 * Obtiene la tasa arancelaria efectiva para una ruta comercial.
 */
export async function getTariffRate(
  importerCountry: string,
  exporterCountry: string,
  hsCode: string
): Promise<TariffResult> {
  const cacheKey = `${importerCountry}-${exporterCountry}-${hsCode}`;

  const cached = getCached(cacheKey);
  if (cached) {
    console.log(`[WTO] Cache HIT → ${cacheKey}`);
    return {
      ...cached,
      reporterCountry: importerCountry,
      exporterCountry,
      hsCode,
      source: 'cache',
    };
  }

  console.log(`[WTO] Fetching tariff: ${cacheKey}`);

  // 1. Detectar tratado
  const treaty = detectTreaty(importerCountry, exporterCountry);

  // 2. Obtener MFN de la WTO API (con fallback)
  let mfnRate = await fetchWTOTariff(importerCountry, hsCode);
  const source: TariffResult['source'] = mfnRate !== null ? 'api' : 'fallback';
  if (mfnRate === null) {
    mfnRate = getFallbackRate(hsCode);
  }

  // 3. Calcular tasa efectiva
  let preferentialRate: number | undefined;
  let effectiveRate = mfnRate;

  if (treaty) {
    preferentialRate = mfnRate * (1 - treaty.reduction / 100);
    effectiveRate = preferentialRate;
  }

  const result: TariffResult = {
    reporterCountry: importerCountry,
    exporterCountry,
    hsCode,
    mfnRate,
    preferentialRate,
    treatyName: treaty?.name,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    source,
  };

  setCache(cacheKey, result);
  return result;
}
