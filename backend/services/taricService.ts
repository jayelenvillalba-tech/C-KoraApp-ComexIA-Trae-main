import { logger } from './logger.js';
import Database from 'better-sqlite3';
import path from 'path';

let db: any;

try {
  db = new Database(path.join(process.cwd(), 'comexia_v2.db'));
} catch (err: any) {
  logger.error('[taric] Error connecting to DB in taricService', err);
}

// TARIC API oficial de la UE
// Documentación: https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp
const TARIC_BASE = 'https://ec.europa.eu/taxation_customs/tariff-service-gateway';

// Dataset TARIC embebido — los 300 más relevantes para exportaciones LatAm→UE
const TARIC_EMBEDDED: Array<{ hs6: string; taric10: string; desc_en: string; desc_es: string; duty: number; }> = [
  // ── CEREALES Y OLEAGINOSAS (crítico para AR/BR) ──
  { hs6: '100199', taric10: '1001990000', desc_en: 'Common wheat and meslin, not for sowing', desc_es: 'Trigo común y morcajo, excepto para siembra', duty: 0 },
  { hs6: '100590', taric10: '1005900000', desc_en: 'Maize (corn), other than seed', desc_es: 'Maíz, excepto para siembra', duty: 0 },
  { hs6: '120190', taric10: '1201900000', desc_en: 'Soybeans, whether or not broken, other', desc_es: 'Habas de soja, incluso quebrantadas', duty: 0 },
  { hs6: '120600', taric10: '1206000000', desc_en: 'Sunflower seeds, whether or not broken', desc_es: 'Semillas de girasol, incluso quebrantadas', duty: 0 },
  { hs6: '150710', taric10: '1507100000', desc_en: 'Crude soybean oil, whether or not degummed', desc_es: 'Aceite de soja en bruto', duty: 0 },
  { hs6: '151211', taric10: '1512110000', desc_en: 'Crude sunflower-seed oil', desc_es: 'Aceite de girasol en bruto', duty: 0 },
  { hs6: '230400', taric10: '2304000000', desc_en: 'Oilcake from soybean oil extraction', desc_es: 'Tortas de extracción de aceite de soja', duty: 0 },

  // ── CARNES (con arancel MFN de la UE) ──
  { hs6: '020130', taric10: '0201300000', desc_en: 'Boneless bovine meat, fresh or chilled', desc_es: 'Carne bovina deshuesada, fresca o refrigerada', duty: 12.8 },
  { hs6: '020230', taric10: '0202300000', desc_en: 'Boneless bovine meat, frozen', desc_es: 'Carne bovina deshuesada, congelada', duty: 12.8 },
  { hs6: '020711', taric10: '0207110000', desc_en: 'Whole fresh or chilled chickens', desc_es: 'Pollos enteros frescos o refrigerados', duty: 26.2 },
  { hs6: '020712', taric10: '0207120000', desc_en: 'Whole frozen chickens', desc_es: 'Pollos enteros congelados', duty: 26.2 },

  // ── PESCADOS Y MARISCOS ──
  { hs6: '030613', taric10: '0306130000', desc_en: 'Frozen shrimps and prawns', desc_es: 'Camarones y langostinos congelados', duty: 12 },
  { hs6: '030624', taric10: '0306240000', desc_en: 'Crabs, not frozen', desc_es: 'Cangrejos sin congelar', duty: 0 },

  // ── FRUTAS (con preferencias MERCOSUR) ──
  { hs6: '080510', taric10: '0805100000', desc_en: 'Oranges, fresh or dried', desc_es: 'Naranjas frescas o secas', duty: 16 },
  { hs6: '080520', taric10: '0805200000', desc_en: 'Mandarins, clementines, fresh or dried', desc_es: 'Mandarinas, frescas o secas', duty: 16 },
  { hs6: '080610', taric10: '0806100000', desc_en: 'Fresh grapes', desc_es: 'Uvas frescas', duty: 14.4 },
  { hs6: '080810', taric10: '0808100000', desc_en: 'Fresh apples', desc_es: 'Manzanas frescas', duty: 11.5 },
  { hs6: '080820', taric10: '0808200000', desc_en: 'Fresh pears and quinces', desc_es: 'Peras y membrillos frescos', duty: 11.5 },

  // ── VINOS (clave para AR/CL) ──
  { hs6: '220410', taric10: '2204100000', desc_en: 'Sparkling wine', desc_es: 'Vinos espumosos', duty: 32 },
  { hs6: '220421', taric10: '2204210000', desc_en: 'Wine in containers ≤2L', desc_es: 'Vino en recipientes ≤2L', duty: 32 },
  { hs6: '220429', taric10: '2204290000', desc_en: 'Wine in containers >2L', desc_es: 'Vino en recipientes >2L', duty: 32 },

  // ── MINERALES Y METALES ──
  { hs6: '260111', taric10: '2601110000', desc_en: 'Non-agglomerated iron ores', desc_es: 'Minerales de hierro sin aglomerar', duty: 0 },
  { hs6: '270900', taric10: '2709000000', desc_en: 'Petroleum oils, crude', desc_es: 'Aceites crudos de petróleo', duty: 0 },
  { hs6: '740311', taric10: '7403110000', desc_en: 'Refined copper cathodes', desc_es: 'Cátodos de cobre refinado', duty: 0 },
  { hs6: '720829', taric10: '7208290000', desc_en: 'Flat-rolled iron products, hot-rolled', desc_es: 'Productos planos de hierro, laminados en caliente', duty: 0 },

  // ── MANUFACTURAS ──
  { hs6: '847130', taric10: '8471300000', desc_en: 'Portable automatic data-processing machines', desc_es: 'Máquinas automáticas portátiles de tratamiento de información', duty: 0 },
  { hs6: '851712', taric10: '8517120000', desc_en: 'Telephones for cellular networks (smartphones)', desc_es: 'Teléfonos para redes celulares (smartphones)', duty: 0 },
  { hs6: '870322', taric10: '8703220000', desc_en: 'Passenger vehicles, 1000-1500cc', desc_es: 'Vehículos de turismo, cilindrada 1000-1500cc', duty: 6.5 },
  { hs6: '870323', taric10: '8703230000', desc_en: 'Passenger vehicles, 1500-3000cc', desc_es: 'Vehículos de turismo, cilindrada 1500-3000cc', duty: 6.5 },

  // ── TEXTILES ──
  { hs6: '520100', taric10: '5201000000', desc_en: 'Cotton, not carded or combed', desc_es: 'Algodón sin cardar ni peinar', duty: 0 },
  { hs6: '610910', taric10: '6109100000', desc_en: 'T-shirts of cotton, knitted', desc_es: 'Camisetas de punto de algodón', duty: 12 },
  { hs6: '620342', taric10: '6203420000', desc_en: "Men's trousers of cotton", desc_es: 'Pantalones de algodón para hombres', duty: 12 },

  // ── FARMACÉUTICA ──
  { hs6: '300490', taric10: '3004900000', desc_en: 'Other medicaments in measured doses', desc_es: 'Los demás medicamentos en dosis', duty: 0 },

  // ── AGROQUÍMICOS ──
  { hs6: '310210', taric10: '3102100000', desc_en: 'Urea, whether or not in aqueous solution', desc_es: 'Urea, incluso en solución acuosa', duty: 6.5 },
  { hs6: '310420', taric10: '3104200000', desc_en: 'Potassium chloride', desc_es: 'Cloruro de potasio', duty: 0 },
];

export async function loadTaricCodes(): Promise<void> {
  if (!db) return;
  try {
    const existingResult: any = db.prepare("SELECT COUNT(*) as c FROM hs_codes_global WHERE taric10 IS NOT NULL").get();
    const existing = existingResult ? existingResult.c : 0;

    if (existing > 100) {
      logger.info(`[taric] Ya hay ${existing} códigos TARIC cargados`);
      return;
    }

    logger.info('[taric] Cargando códigos TARIC embebidos...');

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO hs_codes_global
        (hs6, taric10, desc_es, desc_en, chapter, heading, arancel_taric)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertAll = db.transaction(() => {
      for (const c of TARIC_EMBEDDED) {
        stmt.run(
          c.hs6,
          c.taric10,
          c.desc_es,
          c.desc_en,
          c.hs6.substring(0, 2),
          c.hs6.substring(0, 4),
          c.duty
        );
      }
    });

    insertAll();
    logger.info(`[taric] ✅ ${TARIC_EMBEDDED.length} códigos TARIC cargados`);

    // Intentar descarga del dataset completo TARIC en background
    downloadTaricComplete().catch(e =>
      logger.warn('[taric] Descarga completa falló, usando embebido', { error: e.message })
    );
  } catch (err) {
    logger.error('[taric] Error initializing TARIC table', err);
  }
}

async function downloadTaricComplete(): Promise<void> {
  const url = 'https://ec.europa.eu/taxation_customs/tariff-service-gateway/measures?dateStart=2024-01-01&format=json&language=ES';
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`TARIC API: ${response.status}`);
    }

    const data = await response.json();
    logger.info(`[taric] Dataset completo descargado: ${data?.length || 0} registros`);

    if (Array.isArray(data) && db) {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO hs_codes_global (hs6, taric10, desc_es, desc_en, chapter, heading, arancel_taric)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const insertBatch = db.transaction((items: any[]) => {
        for (const item of items) {
          const code = item.commodityCode || item.code;
          if (code && code.length >= 6) {
            stmt.run(
              code.substring(0, 6),
              code.length === 10 ? code : null,
              item.description || item.descriptionEN || 'Unknown',
              item.descriptionEN || item.description || 'Unknown',
              code.substring(0, 2),
              code.substring(0, 4),
              item.dutyRate || null
            );
          }
        }
      });

      insertBatch(data);
      logger.info('[taric] ✅ Dataset TARIC completo procesado');
    }
  } catch (error) {
    throw error;
  }
}

// Buscar en TARIC por código o descripción
export function searchTaric(query: string): any[] {
  if (!db) return [];
  const isCode = /^\d+$/.test(query);

  if (isCode) {
    return db.prepare(`
      SELECT * FROM hs_codes_global
      WHERE taric10 LIKE ? OR hs6 LIKE ?
      LIMIT 10
    `).all(`${query}%`, `${query}%`);
  }

  return db.prepare(`
    SELECT * FROM hs_codes_global
    WHERE (desc_es LIKE ? OR desc_en LIKE ?)
    AND taric10 IS NOT NULL
    LIMIT 10
  `).all(`%${query}%`, `%${query}%`);
}
