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

    if (alert_type) {
      query += ` AND type = ?`;
      params.push(alert_type);
    }

    query += ` ORDER BY publish_date DESC LIMIT ?`;
    params.push(parseInt(limit as string) || 10);

    const news = sqliteDb.prepare(query).all(...params) as any[];

    // Si no hay noticias → insertar seed automáticamente
    if (news.length === 0) {
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
