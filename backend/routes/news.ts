import express from 'express';
import { sqliteDb } from '../../database/db-sqlite';

const router = express.Router();

// GET /api/news — Fetch news from trade_news table
router.get('/', async (req, res) => {
  const {
    lang = 'es',
    limit = '10',
    period = '30',
    countries,
    alert_type,
  } = req.query;

  try {
    if (!sqliteDb) return res.status(503).json({ news: [], total: 0, error: 'DB not ready' });

    let query = `
      SELECT
        id,
        source as source_name,
        source_url,
        CASE
          WHEN ? = 'es' AND title IS NOT NULL THEN title
          ELSE title_en
        END as title,
        title_en as body,
        type as alert_type,
        affected_countries as countries,
        affected_hs_codes as hs_codes,
        publish_date as published_at,
        'es' as source_language
      FROM trade_news
      WHERE publish_date > strftime('%s','now') - (? * 24 * 60 * 60)
    `;

    const params: any[] = [lang, parseInt(period as string) || 30];

    if (countries) {
      query += ` AND (affected_countries LIKE ? OR affected_countries LIKE '%["*"]%')`;
      params.push(`%"${countries}"%`);
    }

    if (req.query.hsCode) {
      const chapter = (req.query.hsCode as string).substring(0, 2);
      query += ` AND (affected_hs_codes LIKE ? OR affected_hs_codes LIKE '%["*"]%')`;
      params.push(`%"${chapter}"%`);
    }

    if (alert_type) {
      query += ` AND type = ?`;
      params.push(alert_type);
    }

    query += ` ORDER BY publish_date DESC LIMIT ?`;
    params.push(parseInt(limit as string) || 10);

    const news = sqliteDb.prepare(query).all(...params) as any[];

    // Si no hay noticias
    if (news.length === 0) {
      if (countries || req.query.hsCode) {
         // Generar mock contextualizado para la demo en vez de devolver el seed global (que es de Argentina)
         const countryLabel = countries ? String(countries).split(',')[0] : 'el destino';
         const productLabel = req.query.hsCode ? `el código HS ${req.query.hsCode}` : 'el producto';
         const mockNews = [
            {
               id: 'mock_1',
               title: lang === 'es' ? `Nuevas regulaciones en ${countryLabel} para ${productLabel}` : `New regulations in ${countryLabel} for ${productLabel}`,
               source_name: 'Customs Authority',
               published_at: Math.floor(Date.now()/1000) - 86400,
               alert_type: 'regulation'
            },
            {
               id: 'mock_2',
               title: lang === 'es' ? `Actualización de aranceles de importación en ${countryLabel}` : `Import tariffs update in ${countryLabel}`,
               source_name: 'Trade Ministry',
               published_at: Math.floor(Date.now()/1000) - 172800,
               alert_type: 'warning'
            },
            {
               id: 'mock_3',
               title: lang === 'es' ? `Oportunidad: demanda en alza en ${countryLabel} para ${productLabel}` : `Opportunity: rising demand in ${countryLabel} for ${productLabel}`,
               source_name: 'Global Trade Analytics',
               published_at: Math.floor(Date.now()/1000) - 259200,
               alert_type: 'opportunity'
            }
         ];
         return res.json({ news: mockNews, total: mockNews.length, mock: true });
      }

      const { seedNews } = await import('../jobs/seedNews.js');
      await seedNews();
      const seeded = sqliteDb.prepare(
        `SELECT
          id, source as source_name, source_url, title, title_en, type as alert_type,
          affected_countries as countries, affected_hs_codes as hs_codes, publish_date as published_at
         FROM trade_news ORDER BY publish_date DESC LIMIT ?`
      ).all(parseInt(limit as string) || 10);
      return res.json({ news: seeded, total: seeded.length, seeded: true });
    }

    res.json({ news, total: news.length });
  } catch (error) {
    console.error('[news] Error fetching news:', error);
    res.status(500).json({ error: 'Error cargando noticias', news: [] });
  }
});

// POST /api/news — Admin/Scraper endpoint to add news
router.post('/', async (req, res) => {
  const { title, titleEn, source, sourceUrl, type, severity, affectedCountries, affectedHsCodes, publishDate } = req.body;
  
  try {
    if (!sqliteDb) return res.status(503).json({ error: 'DB not ready' });

    const id = `news_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    sqliteDb.prepare(`
      INSERT INTO trade_news (id, title, title_en, source, source_url, type, severity, affected_countries, affected_hs_codes, publish_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, title, titleEn, source, sourceUrl, type || 'info', severity || 'medium',
      JSON.stringify(affectedCountries || []), JSON.stringify(affectedHsCodes || []),
      publishDate || Math.floor(Date.now() / 1000)
    );

    res.status(201).json({ success: true, id });
  } catch (error) {
    console.error('Error adding news:', error);
    res.status(500).json({ error: 'Failed to add news' });
  }
});

// GET /api/news/latest — Quick 5 for dashboards
router.get('/latest', (req, res) => {
  try {
    if (!sqliteDb) return res.json([]);
    const rows = sqliteDb.prepare(`SELECT * FROM trade_news ORDER BY publish_date DESC LIMIT 5`).all();
    res.json(rows);
  } catch {
    res.json([]);
  }
});

// POST /api/news/sync — Trigger maritime GDELT sync
router.post('/sync', async (_req, res) => {
  try {
    const { syncMaritimeAlerts } = await import('../services/maritimeRisk.js');
    syncMaritimeAlerts().catch(() => {});
    res.json({ message: 'Sync iniciado en background' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error triggering sync', detail: error.message });
  }
});

export default router;
