import { logger } from '../services/logger.js';
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'comexia_v2.db'));

const USDA_BASE = 'https://marsapi.ams.usda.gov/services/v1.2';

const HS_TO_COMMODITY: Record<string, {
  name: string; unit: string; usdaSlug: string;
}> = {
  '120190': { name: 'Soybeans', unit: 'bu', usdaSlug: 'soybean' },
  '100199': { name: 'Wheat', unit: 'bu', usdaSlug: 'wheat' },
  '100590': { name: 'Corn', unit: 'bu', usdaSlug: 'corn' },
  '150710': { name: 'Soybean Oil', unit: 'lb', usdaSlug: 'soybean-oil' },
  '230400': { name: 'Soybean Meal', unit: 'ton', usdaSlug: 'soybean-meal' },
  '020130': { name: 'Beef', unit: 'cwt', usdaSlug: 'beef' },
  '020711': { name: 'Broilers', unit: 'lb', usdaSlug: 'broiler' },
};

// Precios de referencia BCR Rosario — fallback actualizado Marzo 2026
const FALLBACK_PRICES: Record<string, any> = {
  '120190': { commodity: 'Soja', pricePerTonne: 453.20, change24h: -1.5, changeDirection: 'down', source: 'bcr_estimate' },
  '100199': { commodity: 'Trigo', pricePerTonne: 284.50, change24h: 4.2, changeDirection: 'up', source: 'bcr_estimate' },
  '100590': { commodity: 'Maíz', pricePerTonne: 198.20, change24h: 0.8, changeDirection: 'up', source: 'bcr_estimate' },
  '150710': { commodity: 'Aceite de Soja', pricePerTonne: 1042, change24h: 2.1, changeDirection: 'up', source: 'bcr_estimate' },
  '230400': { commodity: 'Harina de Soja', pricePerTonne: 398, change24h: -0.3, changeDirection: 'down', source: 'bcr_estimate' },
  '020130': { commodity: 'Carne Bovina', pricePerTonne: 4200, change24h: 0.5, changeDirection: 'up', source: 'bcr_estimate' },
  '220421': { commodity: 'Vino', pricePerTonne: 1800, change24h: 0, changeDirection: 'stable', source: 'bcr_estimate' },
  '740311': { commodity: 'Cobre', pricePerTonne: 9218, change24h: -0.8, changeDirection: 'down', source: 'bcr_estimate' },
  '260111': { commodity: 'Mineral de Hierro', pricePerTonne: 118, change24h: 1.2, changeDirection: 'up', source: 'bcr_estimate' },
  '270900': { commodity: 'Petróleo Crudo', pricePerTonne: 529, change24h: 1.1, changeDirection: 'up', source: 'bcr_estimate' },
};

export async function getCommodityPrice(hsCode: string): Promise<any | null> {
  const hs6 = hsCode.replace(/\./g, '').substring(0, 6);
  const cacheKey = `commodity_price:${hs6}`;

  // Check cache (table logistics_cache may or may not exist — try/catch)
  try {
    const cached = db.prepare(
      'SELECT data FROM logistics_cache WHERE cache_key = ? AND expires_at > ?'
    ).get(cacheKey, Math.floor(Date.now() / 1000)) as { data: string } | undefined;

    if (cached) return JSON.parse(cached.data);
  } catch {
    // cache table might not exist yet
  }

  const commodity = HS_TO_COMMODITY[hs6];
  if (commodity) {
    try {
      const response = await fetch(
        `${USDA_BASE}/reports?q=${commodity.usdaSlug}&allSections=true&limit=1`,
        { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(5000) }
      );
      if (response.ok) {
        const data = await response.json();
        const report = data?.results?.[0];
        if (report) {
          const price = {
            hsCode: hs6,
            commodity: commodity.name,
            pricePerTonne: parseFloat(report.avg_price || 0),
            change24h: 0,
            changeDirection: 'stable',
            lastUpdated: new Date(),
            source: 'usda_ams',
          };
          try {
            db.prepare(`
              INSERT OR REPLACE INTO logistics_cache (cache_key, data, created_at, expires_at)
              VALUES (?, ?, ?, ?)
            `).run(cacheKey, JSON.stringify(price),
              Math.floor(Date.now() / 1000),
              Math.floor(Date.now() / 1000) + 3600
            );
          } catch { /* ignore cache write fail */ }
          return price;
        }
      }
    } catch (error) {
      logger.warn('[usdaAms] API error, using fallback', { error: (error as Error).message });
    }
  }

  const fallback = FALLBACK_PRICES[hs6];
  if (fallback) {
    const price = { ...fallback, hsCode: hs6, lastUpdated: new Date() };
    try {
      db.prepare(`
        INSERT OR REPLACE INTO logistics_cache (cache_key, data, created_at, expires_at)
        VALUES (?, ?, ?, ?)
      `).run(cacheKey, JSON.stringify(price),
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + 3600
      );
    } catch { /* ignore */ }
    return price;
  }
  return null;
}

export async function analyzePriceVsMarket(
  offeredPriceUsd: number,
  hsCode: string
): Promise<{ marketPrice: number; deviation: number; assessment: string; label: string; source: string }> {
  const marketData = await getCommodityPrice(hsCode);
  if (!marketData) return { marketPrice: 0, deviation: 0, assessment: 'fair', label: 'Sin referencia de mercado', source: 'n/a' };

  const deviation = ((offeredPriceUsd - marketData.pricePerTonne) / marketData.pricePerTonne) * 100;

  let assessment: string;
  let label: string;
  if (deviation < -10) { assessment = 'excellent'; label = '🟢 Muy buen precio'; }
  else if (deviation < -3) { assessment = 'good'; label = '✅ Precio competitivo'; }
  else if (deviation < 5) { assessment = 'fair'; label = '📊 Precio de mercado'; }
  else { assessment = 'expensive'; label = '🔴 Sobre el mercado'; }

  return {
    marketPrice: marketData.pricePerTonne,
    deviation: Math.round(deviation * 10) / 10,
    assessment,
    label,
    source: marketData.source === 'usda_ams' ? 'USDA AMS' : 'BCR Rosario (estimado)',
  };
}
