import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'comexia_v2.db'));

const NEWS_SEED = [
  {
    source_name: 'AFIP',
    source_url: 'https://www.afip.gob.ar/noticias',
    source_language: 'es',
    title_original: 'AFIP actualiza el régimen de exportaciones simplificadas para PyMEs',
    title_en: 'AFIP updates simplified export regime for SMEs',
    body_en: 'AFIP updated the simplified export regime increasing the annual limit to USD 600,000 for SMEs.',
    alert_type: 'regulation',
    countries: JSON.stringify(['AR']),
    hs_codes: JSON.stringify([]),
    published_at: Math.floor(Date.now() / 1000) - 86400, // ayer
  },
  {
    source_name: 'BCRA',
    source_url: 'https://www.bcra.gob.ar',
    source_language: 'es',
    title_original: 'BCRA modifica condiciones para liquidación de divisas de exportaciones agrícolas',
    title_en: 'BCRA modifies conditions for settlement of agricultural export currencies',
    body_en: 'The Central Bank of Argentina updated foreign currency settlement rules for agricultural exporters.',
    alert_type: 'warning',
    countries: JSON.stringify(['AR']),
    hs_codes: JSON.stringify(['1201', '1001', '1005']),
    published_at: Math.floor(Date.now() / 1000) - 172800, // hace 2 días
  },
  {
    source_name: 'WTO',
    source_url: 'https://www.wto.org/english/news_e/news26_e.htm',
    source_language: 'en',
    title_original: 'WTO projects 2.7% growth in global merchandise trade for 2026',
    title_en: 'WTO projects 2.7% growth in global merchandise trade for 2026',
    body_en: 'World Trade Organization forecasts moderate recovery in global trade volumes for 2026.',
    alert_type: 'opportunity',
    countries: JSON.stringify([]),
    hs_codes: JSON.stringify([]),
    published_at: Math.floor(Date.now() / 1000) - 259200,
  },
  {
    source_name: 'SENASA',
    source_url: 'https://www.argentina.gob.ar/senasa',
    source_language: 'es',
    title_original: 'SENASA habilita nuevas zonas de producción de soja orgánica para exportación a la UE',
    title_en: 'SENASA enables new organic soybean production zones for EU export',
    body_en: 'SENASA approved new production zones for organic soybean exports to the European Union.',
    alert_type: 'opportunity',
    countries: JSON.stringify(['AR', 'DE', 'NL', 'ES']),
    hs_codes: JSON.stringify(['1201']),
    published_at: Math.floor(Date.now() / 1000) - 345600,
  },
  {
    source_name: 'UKMTO',
    source_url: 'https://www.ukmto.org',
    source_language: 'en',
    title_original: 'Red Sea: ongoing security situation affects shipping routes',
    title_en: 'Red Sea: ongoing security situation affects shipping routes through Bab-el-Mandeb',
    body_en: 'Major carriers continue to avoid Red Sea routes. Estimated additional cost: USD 2,800 per 40GP container.',
    alert_type: 'warning',
    countries: JSON.stringify(['DE', 'NL', 'IN', 'CN', 'JP']),
    hs_codes: JSON.stringify([]),
    published_at: Math.floor(Date.now() / 1000) - 43200,
  },
  {
    source_name: 'INDEC',
    source_url: 'https://www.indec.gob.ar',
    source_language: 'es',
    title_original: 'Exportaciones argentinas crecieron 14% interanual en el primer trimestre de 2026',
    title_en: 'Argentine exports grew 14% year-on-year in the first quarter of 2026',
    body_en: 'INDEC reported 14% year-on-year growth in Argentine exports, driven by oilseeds and cereals.',
    alert_type: 'opportunity',
    countries: JSON.stringify(['AR']),
    hs_codes: JSON.stringify(['1201', '1001', '1005', '1507']),
    published_at: Math.floor(Date.now() / 1000) - 432000,
  },
  {
    source_name: 'Comisión Europea',
    source_url: 'https://ec.europa.eu/trade',
    source_language: 'es',
    title_original: 'UE avanza en la ratificación del acuerdo comercial con MERCOSUR',
    title_en: 'EU advances in ratification of trade agreement with MERCOSUR',
    body_en: 'The European Parliament advances in the ratification process of the EU-MERCOSUR agreement.',
    alert_type: 'treaty',
    countries: JSON.stringify(['AR', 'BR', 'UY', 'PY', 'DE', 'FR', 'ES']),
    hs_codes: JSON.stringify([]),
    published_at: Math.floor(Date.now() / 1000) - 518400,
  },
  {
    source_name: 'GACC',
    source_url: 'http://www.customs.gov.cn',
    source_language: 'zh',
    title_original: 'GACC: nuevos requisitos de registro para exportadores de alimentos a China',
    title_en: 'GACC: new registration requirements for food exporters to China',
    body_en: 'China GACC requires all overseas food manufacturers to renew registration via the Single Window system.',
    alert_type: 'critical',
    countries: JSON.stringify(['CN', 'AR', 'BR']),
    hs_codes: JSON.stringify(['0201', '1201', '0207']),
    published_at: Math.floor(Date.now() / 1000) - 604800,
  },
];

export async function seedNews(): Promise<void> {
  const existing = (db.prepare(
    'SELECT COUNT(*) as c FROM trade_news'
  ).get() as any).c;

  // Solo insertar si hay menos de 5 noticias
  if (existing >= 5) {
    console.log(`[seedNews] Ya hay ${existing} noticias — no se insertan seeds`);
    return;
  }

  console.log('[seedNews] Insertando noticias seed...');

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO trade_news
      (id, source, source_url, title, title_en, type, severity, affected_countries, affected_hs_codes, publish_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAll = db.transaction(() => {
    let i = 1;
    for (const n of NEWS_SEED) {
      stmt.run(
        'seed-auto-' + i++, n.source_name, n.source_url,
        n.title_original, n.title_en, n.alert_type,
        'medium', n.countries, n.hs_codes, n.published_at
      );
    }
  });

  insertAll();
  console.log(`[seedNews] ✅ ${NEWS_SEED.length} noticias insertadas`);
}
