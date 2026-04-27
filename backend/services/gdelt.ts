/**
 * GDELT News Service — Che.Comex
 * GDELT Project — gratuito, sin límite, latencia 15 min
 * https://api.gdeltproject.org/api/v2/doc/doc
 */

export interface GDELTResult {
  title: string;
  url: string;
  sourceCountry: string;
  publishDate: Date;
  tone: number;
  relevanceScore: number;
  alertType: 'critical' | 'warning' | 'opportunity' | 'info';
}

const GDELT_DOC_API = 'https://api.gdeltproject.org/api/v2/doc/doc';

// HS Chapter → search keywords
const HS_KEYWORDS: Record<string, string[]> = {
  '10': ['wheat', 'corn', 'grain', 'cereal', 'trigo', 'maíz'],
  '12': ['soybean', 'soja', 'oilseed'],
  '02': ['beef', 'meat', 'carne bovina'],
  '15': ['soybean oil', 'sunflower oil', 'aceite soja'],
  '27': ['crude oil', 'petroleum', 'petróleo', 'vaca muerta'],
  '85': ['electronics', 'semiconductor', 'chips', 'technology'],
  '84': ['machinery', 'equipment', 'maquinaria'],
  '28': ['lithium', 'litio', 'battery mineral'],
  '03': ['fish', 'seafood', 'pesquero'],
  '22': ['wine', 'vino', 'beverage'],
};

function buildQuery(hsCode: string, countries: string[]): string {
  const chapter = hsCode?.substring(0, 2) || '';
  const productTerms = HS_KEYWORDS[chapter] || ['trade', 'export', 'import'];

  const countryTerms = countries
    .map(c => {
      const map: Record<string, string> = {
        'AR': 'Argentina', 'BR': 'Brazil', 'CN': 'China', 'US': 'United States',
        'DE': 'Germany', 'CL': 'Chile', 'UY': 'Uruguay', 'PE': 'Peru',
        'CO': 'Colombia', 'MX': 'Mexico', 'ES': 'Spain', 'UE': 'European Union',
      };
      return map[c] || c;
    });

  const terms = [...productTerms.slice(0, 2), 'tariff regulation trade'];
  if (countryTerms.length) terms.push(countryTerms[0]);

  return terms.join(' ');
}

function classifyByTone(tone: number): GDELTResult['alertType'] {
  if (tone < -3) return 'critical';
  if (tone < -1) return 'warning';
  if (tone > 2) return 'opportunity';
  return 'info';
}

export async function searchTradeNews(
  hsCode: string,
  countries: string[],
  maxRecords = 10
): Promise<GDELTResult[]> {
  const query = buildQuery(hsCode, countries);

  const url = new URL(GDELT_DOC_API);
  url.searchParams.set('query', query);
  url.searchParams.set('mode', 'ArtList');
  url.searchParams.set('maxrecords', String(Math.min(maxRecords, 25)));
  url.searchParams.set('timespan', '24h');
  url.searchParams.set('format', 'json');
  url.searchParams.set('sort', 'DateDesc');

  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`GDELT ${res.status}`);

    const data = await res.json() as any;
    const articles = data?.articles || [];

    return articles.map((a: any) => ({
      title: a.title || 'Sin título',
      url: a.url || '',
      sourceCountry: a.sourcecountry || '',
      publishDate: a.seendate
        ? new Date(a.seendate.replace(/(\d{4})(\d{2})(\d{2}).*/, '$1-$2-$3'))
        : new Date(),
      tone: parseFloat(a.tone || '0'),
      relevanceScore: 70,
      alertType: classifyByTone(parseFloat(a.tone || '0')),
    }));

  } catch (err: any) {
    console.warn('[GDELT] Search failed:', err.message);
    return [];
  }
}

// ─── Feed for background news sync ───────────────────────────────────────────
export async function fetchGDELTTradeAlerts(
  countries: string[] = ['AR', 'BR', 'CN']
): Promise<GDELTResult[]> {
  const queries = [
    'trade tariff regulation customs ban',
    'export import sanction embargo',
    'trade agreement free trade deal',
  ];

  const results: GDELTResult[] = [];
  for (const q of queries) {
    try {
      const url = new URL(GDELT_DOC_API);
      url.searchParams.set('query', q);
      url.searchParams.set('mode', 'ArtList');
      url.searchParams.set('maxrecords', '5');
      url.searchParams.set('timespan', '30m');
      url.searchParams.set('format', 'json');

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;

      const data = await res.json() as any;
      const articles = (data?.articles || []).map((a: any) => ({
        title: a.title || '',
        url: a.url || '',
        sourceCountry: a.sourcecountry || '',
        publishDate: new Date(),
        tone: parseFloat(a.tone || '0'),
        relevanceScore: 60,
        alertType: classifyByTone(parseFloat(a.tone || '0')),
      }));
      results.push(...articles);
    } catch {}
  }

  return results;
}
