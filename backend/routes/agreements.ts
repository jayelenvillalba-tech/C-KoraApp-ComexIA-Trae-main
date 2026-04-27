import { Router } from 'express';
import { analyzeRoute } from '../services/routeAnalysis.js';
import Database from 'better-sqlite3';
import path from 'path';

const router = Router();
const db = new Database(path.join(process.cwd(), 'comexia_v2.db'));

// GET /api/agreements/route?origin=AR&destination=DE&hsCode=120190
// Análisis completo de ruta: tratados + aranceles + documentos
router.get('/route', async (req, res) => {
  const { origin, destination, hsCode, lang = 'es' } = req.query;

  if (!origin || !destination || !hsCode) {
    return res.status(400).json({
      error: 'origin, destination y hsCode son requeridos'
    });
  }

  try {
    const analysis = await analyzeRoute(
      origin as string,
      destination as string,
      hsCode as string,
      lang as string
    );

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Error analizando la ruta' });
  }
});

// GET /api/agreements/list?country=AR
// Todos los tratados de un país
router.get('/list', (req, res) => {
  const { country } = req.query;

  const agreements = country
    ? db.prepare(`
        SELECT ta.*, GROUP_CONCAT(am.country_code) as members
        FROM trade_agreements ta
        JOIN agreement_members am ON am.agreement_code = ta.code
        WHERE ta.code IN (
          SELECT agreement_code FROM agreement_members WHERE country_code = ?
        )
        GROUP BY ta.code
        ORDER BY ta.status = 'active' DESC, ta.name_es ASC
      `).all(country)
    : db.prepare(`
        SELECT ta.*, GROUP_CONCAT(am.country_code) as members
        FROM trade_agreements ta
        JOIN agreement_members am ON am.agreement_code = ta.code
        GROUP BY ta.code
        ORDER BY ta.status = 'active' DESC
      `).all();

  res.json({ country: country || 'all', agreements });
});

// GET /api/agreements/between?origin=AR&destination=CN
// Tratados específicos entre 2 países
router.get('/between', (req, res) => {
  const { origin, destination } = req.query;

  if (!origin || !destination) {
    return res.status(400).json({ error: 'origin y destination requeridos' });
  }

  const agreements = db.prepare(`
    SELECT ta.code, ta.name_es, ta.name_en, ta.status,
           ta.in_force_date, ta.official_url, ta.notes_es
    FROM trade_agreements ta
    JOIN agreement_members am1 ON am1.agreement_code = ta.code AND am1.country_code = ?
    JOIN agreement_members am2 ON am2.agreement_code = ta.code AND am2.country_code = ?
    WHERE ta.status IN ('active', 'pending')
  `).all(origin, destination) as any[];

  res.json({
    origin,
    destination,
    hasDirectAgreement: agreements.some(a => a.status === 'active'),
    agreements,
  });
});

// GET /api/agreements/documents?origin=AR&destination=DE&hsCode=120190
// Solo los documentos requeridos (sin el análisis completo)
router.get('/documents', async (req, res) => {
  const { origin, destination, hsCode, lang = 'es' } = req.query;

  if (!origin || !destination || !hsCode) {
    return res.status(400).json({ error: 'Parámetros requeridos' });
  }

  try {
    const analysis = await analyzeRoute(
      origin as string,
      destination as string,
      hsCode as string,
      lang as string
    );

    res.json({
      required: analysis.documents.required,
      conditional: analysis.documents.conditional,
      totalCostUsd: analysis.documents.totalCostUsd,
      totalProcessingDays: analysis.documents.totalProcessingDays,
      criticalPath: analysis.documents.criticalPath,
      dataSource: analysis.documents.dataSource,
      warnings: analysis.warnings.filter(w => w.includes('documento') || w.includes('IA')),
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo documentos' });
  }
});

// GET /api/agreements/tariff?origin=AR&destination=DE&hsCode=120190
// Solo el cálculo de arancel
router.get('/tariff', async (req, res) => {
  const { origin, destination, hsCode } = req.query;

  if (!origin || !destination || !hsCode) {
    return res.status(400).json({ error: 'Parámetros requeridos' });
  }

  try {
    const analysis = await analyzeRoute(
      origin as string,
      destination as string,
      hsCode as string
    );

    res.json({
      origin,
      destination,
      hsCode,
      tariff: analysis.tariff,
      agreements: analysis.agreements,
      warnings: analysis.warnings.filter(w =>
        w.includes('tratado') || w.includes('arancel') || w.includes('SGP') || w.includes('RCEP')
      ),
    });
  } catch (error) {
    res.status(500).json({ error: 'Error calculando arancel' });
  }
});

export default router;
