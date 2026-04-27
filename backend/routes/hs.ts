import { Router } from 'express';
import { logger } from '../services/logger.js';
import Database from 'better-sqlite3';
import path from 'path';

const router = Router();
let db: any;

try {
  db = new Database(path.join(process.cwd(), 'comexia_v2.db'));
} catch (err: any) {
  logger.error('[hs] Error connecting to DB in hsRouter', err);
}

import { HsClassifier } from '../services/hs-classifier.js';

// GET /api/hs/search?q=soja&nomenclature=all&country=AR
// Búsqueda unificada en todas las nomenclaturas combinada con IA Semántica
router.get('/search', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'DB not connected' });

  const {
    q = '',
    nomenclature = 'all',  // 'all' | 'ncm' | 'taric' | 'hts' | 'hs6'
    country = 'AR',
    limit = '10',
  } = req.query;

  if (!q || (q as string).length < 2) {
    return res.status(400).json({ error: 'Query debe tener al menos 2 caracteres' });
  }

  const query = (q as string).trim();
  const isCode = /^[\d.]+$/.test(query);
  // No cap: user decides, an error in HS code can hold cargo at customs
  const lim = Math.min(parseInt(limit as string) || 30, 200);

  let results: any[];

  try {
    if (isCode) {
      const normalized = query.replace(/\./g, '');
      results = db.prepare(`
        SELECT
          id, hs6, ncm8, taric10, hts10,
          desc_es, desc_en,
          chapter, section_name,
          arancel_mercosur, arancel_taric, arancel_hts,
          CASE
            WHEN ncm8 LIKE ? THEN 100
            WHEN hs6 LIKE ? THEN 90
            WHEN taric10 LIKE ? THEN 80
            WHEN hts10 LIKE ? THEN 80
            ELSE 50
          END as relevance
        FROM hs_codes_global
        WHERE ncm8 LIKE ? OR hs6 LIKE ? OR taric10 LIKE ? OR hts10 LIKE ?
        ORDER BY relevance DESC, hs6 ASC
        LIMIT ?
      `).all(
        `${normalized}%`, `${normalized}%`, `${normalized}%`, `${normalized}%`,
        `${normalized}%`, `${normalized}%`, `${normalized}%`, `${normalized}%`,
        lim
      );
    } else {
      // Integración correcta: Usar el motor de clasificación semántica/AI del proyecto
      // para identificar el Código de Partida (ej. 4 a 6 dígitos) a partir del lenguaje natural
      const classified = await HsClassifier.classify(query);
      const normalized = classified.code ? classified.code.replace(/\./g, '') : query.replace(/\./g, '');
      
      // Buscar en las 4 nomenclaturas maestras globales basándose en lo que dictaminó la IA
      results = db.prepare(`
        SELECT
          id, hs6, ncm8, taric10, hts10,
          desc_es, desc_en,
          chapter, section_name,
          arancel_mercosur, arancel_taric, arancel_hts,
          CASE
            WHEN ncm8 LIKE ? THEN 100
            WHEN hs6 LIKE ? THEN 90
            WHEN taric10 LIKE ? THEN 80
            WHEN hts10 LIKE ? THEN 80
            ELSE 50
          END as relevance
        FROM hs_codes_global
        WHERE ncm8 LIKE ? OR hs6 LIKE ? OR taric10 LIKE ? OR hts10 LIKE ?
        ORDER BY relevance DESC, hs6 ASC
        LIMIT ?
      `).all(
        `${normalized}%`, `${normalized}%`, `${normalized}%`, `${normalized}%`,
        `${normalized}%`, `${normalized}%`, `${normalized}%`, `${normalized}%`,
        lim
      );
      
      // Si a pesar del código la DB está en blanco para ese capítulo, hacer fallback de emergencia por keyword
      if (results.length === 0) {
        results = db.prepare(`
          SELECT
            id, hs6, ncm8, taric10, hts10,
            desc_es, desc_en,
            chapter, section_name,
            arancel_mercosur, arancel_taric, arancel_hts
          FROM hs_codes_global
          WHERE desc_es LIKE ? OR desc_en LIKE ?
          LIMIT ?
        `).all(`%${query}%`, `%${query}%`, lim);
      }
    }

    // Enriquecer con información del arancel según destino
    const enriched = results.map(r => ({
      ...r,
      // Código principal según país del usuario
      primaryCode: country === 'AR' || country === 'BR' || country === 'UY' || country === 'PY'
        ? (r.ncm8 || r.hs6)
        : r.hs6,
      // Arancel relevante según destino más común
      tariffInfo: {
        mercosur: r.arancel_mercosur !== null ? `${r.arancel_mercosur}%` : 'Consultar',
        eu: r.arancel_taric !== null ? `${r.arancel_taric}%` : 'Consultar',
        usa: r.arancel_hts !== null ? `${r.arancel_hts}%` : 'Consultar',
      },
      nomenclatures: {
        hs6: r.hs6,
        ncm8: r.ncm8 || null,
        taric10: r.taric10 || null,
        hts10: r.hts10 || null,
      },
    }));

    res.json({
      query,
      country,
      totalResults: enriched.length,
      results: enriched,
    });
  } catch (err: any) {
    logger.error('[hs] Search error', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hs/compare?codes=120190,100199&destination=DE
router.get('/compare', (req, res) => {
  if (!db) return res.status(500).json({ error: 'DB not connected' });

  const { codes = '', destination = 'DE' } = req.query;
  const codeList = (codes as string).split(',').map(c => c.trim()).slice(0, 10);

  if (codeList.length === 0) {
    return res.status(400).json({ error: 'Proveer al menos 1 código' });
  }

  try {
    const results = codeList.map(code => {
      const row = db.prepare(`
        SELECT hs6, ncm8, taric10, hts10, desc_es, desc_en,
               arancel_mercosur, arancel_taric, arancel_hts
        FROM hs_codes_global
        WHERE hs6 = ? OR ncm8 = ?
        LIMIT 1
      `).get(code.substring(0, 6), code) as any;

      if (!row) return { code, error: 'No encontrado' };

      const isEU = ['DE','FR','ES','IT','NL','BE','PT','AT','SE','PL','RO'].includes(destination as string);
      const isUSA = destination === 'US';

      return {
        code,
        description: row.desc_es,
        tariff: isEU ? row.arancel_taric : isUSA ? row.arancel_hts : row.arancel_mercosur,
        tariffLabel: isEU ? 'TARIC (UE)' : isUSA ? 'HTS (USA)' : 'AEC (MERCOSUR)',
        codes: {
          hs6: row.hs6,
          ncm8: row.ncm8,
          taric10: row.taric10,
          hts10: row.hts10,
        },
      };
    });

    res.json({ destination, comparison: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hs/chapter/:chapter
router.get('/chapter/:chapter', (req, res) => {
  if (!db) return res.status(500).json({ error: 'DB not connected' });

  const { chapter } = req.params;
  const padded = chapter.padStart(2, '0');

  try {
    const results = db.prepare(`
      SELECT hs6, ncm8, desc_es, desc_en, arancel_mercosur, arancel_taric, arancel_hts
      FROM hs_codes_global
      WHERE chapter = ?
      ORDER BY hs6 ASC
      LIMIT 100
    `).all(padded);

    res.json({ chapter: padded, count: results.length, codes: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hs/:code
router.get('/:code', (req, res) => {
  if (!db) return res.status(500).json({ error: 'DB not connected' });

  const { code } = req.params;
  const normalized = code.replace(/\./g, '');

  try {
    const result = db.prepare(`
      SELECT * FROM hs_codes_global
      WHERE hs6 = ? OR ncm8 = ? OR taric10 = ? OR hts10 = ?
      LIMIT 1
    `).get(
      normalized.substring(0, 6),
      normalized.substring(0, 8),
      normalized,
      normalized
    ) as any;

    if (!result) {
      return res.status(404).json({ error: `Código ${code} no encontrado` });
    }

    res.json({
      ...result,
      links: {
        taric: result.taric10
          ? `https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp?Taric=${result.taric10}`
          : null,
        hts: result.hts10
          ? `https://hts.usitc.gov/#/${result.hts10.replace(/\./g, '')}`
          : null,
        wco: `https://www.wcoomd.org/en/topics/nomenclature/instrument-and-tools/hs-nomenclature-2022-edition.aspx`,
        afip: result.ncm8
          ? `https://www.afip.gob.ar/genericos/nomencladorComun/consulta.asp?ncm=${result.ncm8}`
          : null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
