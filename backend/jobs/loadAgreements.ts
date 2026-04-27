import Database from 'better-sqlite3';
import path from 'path';
import { logger } from '../services/logger.js';

const db = new Database(path.join(process.cwd(), 'comexia_v2.db'));

// ── TRATADOS PRINCIPALES ──────────────────────────────────────────

const AGREEMENTS = [
  // ── LATAM ──
  {
    code: 'MERCOSUR',
    name_es: 'Mercado Común del Sur',
    name_en: 'Southern Common Market',
    name_pt: 'Mercado Comum do Sul',
    type: 'CU',
    status: 'active',
    signed: '1991-03-26',
    in_force: '1995-01-01',
    url: 'https://www.mercosur.int',
    notes_es: 'Unión aduanera. AEC (Arancel Externo Común) aplica a extrazona. Intrazona: 0% para la mayoría de productos.',
    notes_en: 'Customs union. CET applies to extra-zone. Intra-zone: 0% for most products.',
    members: ['AR', 'BR', 'UY', 'PY'],  // VE suspendida
  },
  {
    code: 'ALADI',
    name_es: 'Asociación Latinoamericana de Integración',
    name_en: 'Latin American Integration Association',
    name_pt: 'Associação Latino-Americana de Integração',
    type: 'PTA',
    status: 'active',
    signed: '1980-08-12',
    in_force: '1981-03-18',
    url: 'https://www.aladi.org',
    notes_es: 'Marco general. Acuerdos específicos: ACE-35 (AR-CL), ACE-58 (AR-PE), ACE-36 (AR-BO), etc.',
    notes_en: 'General framework. Specific agreements: ACE-35 (AR-CL), ACE-58 (AR-PE), etc.',
    members: ['AR', 'BO', 'BR', 'CL', 'CO', 'CU', 'EC', 'MX', 'PA', 'PY', 'PE', 'UY', 'VE'],
  },
  {
    code: 'ACE35',
    name_es: 'Acuerdo de Complementación Económica N°35 — Argentina-Chile',
    name_en: 'Economic Complementation Agreement No.35 — Argentina-Chile',
    type: 'FTA',
    status: 'active',
    signed: '1996-06-25',
    in_force: '1996-10-01',
    url: 'https://www.aladi.org/nsfaladi/textacdos.nsf/vtextoaaces/35',
    notes_es: 'Arancel 0% para casi todos los productos. Régimen especial para trigo y harina.',
    notes_en: '0% tariff for almost all products. Special regime for wheat and flour.',
    members: ['AR', 'CL'],
  },
  {
    code: 'ACE58',
    name_es: 'Acuerdo de Complementación Económica N°58 — MERCOSUR-Perú',
    name_en: 'Economic Complementation Agreement No.58 — MERCOSUR-Peru',
    type: 'FTA',
    status: 'active',
    signed: '2003-11-30',
    in_force: '2006-01-01',
    url: 'https://www.aladi.org/nsfaladi/textacdos.nsf/vtextoaaces/58',
    notes_es: 'Desgravación progresiva. Mayoría de productos a 0% desde 2012.',
    notes_en: 'Progressive tariff elimination. Most products at 0% since 2012.',
    members: ['AR', 'BR', 'UY', 'PY', 'PE'],
  },
  {
    code: 'MERCOSUR_UE',
    name_es: 'Acuerdo de Asociación MERCOSUR-Unión Europea',
    name_en: 'MERCOSUR-European Union Association Agreement',
    type: 'FTA',
    status: 'pending',
    signed: '2019-06-28',
    in_force: null,
    url: 'https://ec.europa.eu/trade/policy/in-focus/eu-mercosur-association-agreement/',
    notes_es: 'Firmado en 2019, pendiente ratificación. Cuando entre en vigor: carne bovina 99.000t cuota, vino reducción significativa, soja ya libre.',
    notes_en: 'Signed 2019, pending ratification. When in force: bovine meat 99,000t quota, wine significant reduction, soybeans already duty-free.',
    members: ['AR', 'BR', 'UY', 'PY', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'PT', 'AT', 'SE', 'PL', 'RO', 'CZ', 'HU', 'SK', 'BG', 'HR', 'SI', 'EE', 'LV', 'LT', 'FI', 'DK', 'IE', 'GR', 'CY', 'MT', 'LU'],
  },

  // ── ASIA-PACÍFICO ──
  {
    code: 'RCEP',
    name_es: 'Asociación Económica Integral Regional',
    name_en: 'Regional Comprehensive Economic Partnership',
    type: 'FTA',
    status: 'active',
    signed: '2020-11-15',
    in_force: '2022-01-01',
    url: 'https://rcepsec.org',
    notes_es: 'El mayor tratado del mundo por PIB. Miembros: China, Japón, Corea del Sur, Australia, NZ + 10 ASEAN. AR/BR no son miembros pero sus competidores sí.',
    notes_en: 'Worlds largest trade deal by GDP. Members: China, Japan, South Korea, Australia, NZ + 10 ASEAN. AR/BR not members but competitors are.',
    members: ['CN', 'JP', 'KR', 'AU', 'NZ', 'SG', 'TH', 'MY', 'ID', 'PH', 'VN', 'MM', 'KH', 'LA', 'BN'],
  },
  {
    code: 'CPTPP',
    name_es: 'Tratado Integral y Progresista de Asociación Transpacífico',
    name_en: 'Comprehensive and Progressive Agreement for Trans-Pacific Partnership',
    type: 'FTA',
    status: 'active',
    signed: '2018-03-08',
    in_force: '2018-12-30',
    url: 'https://www.mfat.govt.nz/en/trade/free-trade-agreements/free-trade-agreements-in-force/cptpp/',
    notes_es: 'Miembros LatAm: MX, CL, PE. UK se unió en 2023. AR no es miembro — sus exportaciones a Japón pagan más que competidores CPTPP.',
    notes_en: 'LatAm members: MX, CL, PE. UK joined 2023. AR not member — exports to Japan pay more than CPTPP competitors.',
    members: ['CA', 'MX', 'JP', 'AU', 'NZ', 'SG', 'MY', 'VN', 'PE', 'CL', 'BN', 'GB'],
  },

  // ── AFRICA ──
  {
    code: 'AfCFTA',
    name_es: 'Área de Libre Comercio Continental Africana',
    name_en: 'African Continental Free Trade Area',
    type: 'FTA',
    status: 'active',
    signed: '2018-03-21',
    in_force: '2021-01-01',
    url: 'https://au-afcfta.org',
    notes_es: '54 países africanos. Implementación gradual hasta 2034. Oportunidad para exportadores LatAm de alimentos y manufacturas.',
    notes_en: '54 African countries. Gradual implementation until 2034. Opportunity for LatAm food and manufacturing exporters.',
    members: ['NG', 'ZA', 'EG', 'DZ', 'ET', 'GH', 'TZ', 'KE', 'CI', 'SN', 'CM', 'AO', 'MZ', 'UG', 'SD'],
    // (representativo — son 54 en total)
  },

  // ── NORTEAMÉRICA ──
  {
    code: 'USMCA',
    name_es: 'Tratado entre México, Estados Unidos y Canadá',
    name_en: 'United States-Mexico-Canada Agreement',
    type: 'FTA',
    status: 'active',
    signed: '2018-11-30',
    in_force: '2020-07-01',
    url: 'https://ustr.gov/trade-agreements/free-trade-agreements/united-states-mexico-canada-agreement',
    notes_es: 'Reemplaza al NAFTA. Reglas de origen estrictas para autos. Relevante para usuarios MX.',
    notes_en: 'Replaces NAFTA. Strict rules of origin for autos. Relevant for MX users.',
    members: ['US', 'MX', 'CA'],
  },

  // ── SISTEMAS PREFERENCIALES ──
  {
    code: 'SGP_EU',
    name_es: 'Sistema Generalizado de Preferencias — Unión Europea',
    name_en: 'Generalised Scheme of Preferences — European Union',
    type: 'GSP',
    status: 'active',
    signed: '1971-01-01',
    in_force: '1971-01-01',
    url: 'https://policy.trade.ec.europa.eu/development-and-sustainability/generalised-system-preferences_en',
    notes_es: 'AR y BR pueden usar SGP para acceder a preferencias en UE. Requiere Formulario A o REX (Registered Exporter). AR califica como país en desarrollo.',
    notes_en: 'AR and BR can use GSP to access EU preferences. Requires Form A or REX certificate. AR qualifies as developing country.',
    members: ['AR', 'BR', 'CO', 'PE', 'EC', 'BO', 'PY', 'UY', 'VN', 'ID', 'PH', 'IN', 'PK', 'BD', 'KH'],
  },
  {
    code: 'SGP_US',
    name_es: 'Sistema Generalizado de Preferencias — Estados Unidos',
    name_en: 'Generalised System of Preferences — United States',
    type: 'GSP',
    status: 'active',
    signed: '1976-01-01',
    in_force: '1976-01-01',
    url: 'https://ustr.gov/issue-areas/trade-development/preference-programs/generalized-system-preferences-gsp',
    notes_es: 'AR fue excluida del GSP de USA en 2012. BR mantiene acceso parcial. CL, CO, PE tienen acceso vía CAFTA/TLC.',
    notes_en: 'AR was excluded from US GSP in 2012. BR maintains partial access. CL, CO, PE have access via CAFTA/FTA.',
    members: ['BR', 'CO', 'PE', 'EC', 'BO', 'PY', 'UY', 'IN', 'ID', 'PH', 'VN', 'BD'],
  },
  {
    code: 'ISRAEL_MERCOSUR',
    name_es: 'Tratado de Libre Comercio MERCOSUR-Israel',
    name_en: 'MERCOSUR-Israel Free Trade Agreement',
    type: 'FTA',
    status: 'active',
    signed: '2007-12-18',
    in_force: '2010-04-01',
    url: 'https://www.mercosur.int/acuerdos-firmados/',
    notes_es: 'Importante para exportaciones de alimentos kosher certificados. 0% para la mayoría de productos agrícolas.',
    notes_en: 'Important for certified kosher food exports. 0% for most agricultural products.',
    members: ['AR', 'BR', 'UY', 'PY', 'IL'],
  },
];

// ── TASAS PREFERENCIALES CLAVE ────────────────────────────────────

const AGREEMENT_RATES = [
  // MERCOSUR intrazona — 0% para productos principales
  { agreement: 'MERCOSUR', importer: 'BR', exporter: 'AR', hs6: '120190', prefRate: 0, mfnRate: 8, staging: 'A' },
  { agreement: 'MERCOSUR', importer: 'BR', exporter: 'AR', hs6: '100199', prefRate: 0, mfnRate: 10, staging: 'A' },
  { agreement: 'MERCOSUR', importer: 'BR', exporter: 'AR', hs6: '150710', prefRate: 0, mfnRate: 9, staging: 'A' },
  { agreement: 'MERCOSUR', importer: 'BR', exporter: 'AR', hs6: '220421', prefRate: 0, mfnRate: 27, staging: 'A' },
  { agreement: 'MERCOSUR', importer: 'BR', exporter: 'AR', hs6: '020130', prefRate: 0, mfnRate: 12, staging: 'A' },
  { agreement: 'MERCOSUR', importer: 'AR', exporter: 'BR', hs6: '870322', prefRate: 0, mfnRate: 35, staging: 'A' },
  { agreement: 'MERCOSUR', importer: 'AR', exporter: 'BR', hs6: '851712', prefRate: 0, mfnRate: 20, staging: 'A' },

  // SGP Europa — preferencias para AR/BR
  { agreement: 'SGP_EU', importer: 'DE', exporter: 'AR', hs6: '120190', prefRate: 0, mfnRate: 0, staging: 'A' },
  { agreement: 'SGP_EU', importer: 'DE', exporter: 'AR', hs6: '020130', prefRate: 7.7, mfnRate: 12.8, staging: 'B' },
  { agreement: 'SGP_EU', importer: 'DE', exporter: 'AR', hs6: '220421', prefRate: 0, mfnRate: 32, staging: 'A' },
  { agreement: 'SGP_EU', importer: 'FR', exporter: 'AR', hs6: '080610', prefRate: 0, mfnRate: 14.4, staging: 'A' },
  { agreement: 'SGP_EU', importer: 'NL', exporter: 'BR', hs6: '090111', prefRate: 0, mfnRate: 7.5, staging: 'A' },

  // ACE-35 Argentina-Chile
  { agreement: 'ACE35', importer: 'CL', exporter: 'AR', hs6: '120190', prefRate: 0, mfnRate: 6, staging: 'A' },
  { agreement: 'ACE35', importer: 'CL', exporter: 'AR', hs6: '220421', prefRate: 0, mfnRate: 15, staging: 'A' },
  { agreement: 'ACE35', importer: 'AR', exporter: 'CL', hs6: '080810', prefRate: 0, mfnRate: 0, staging: 'A' },
  { agreement: 'ACE35', importer: 'AR', exporter: 'CL', hs6: '080910', prefRate: 0, mfnRate: 0, staging: 'A' },

  // ACE-58 MERCOSUR-Perú
  { agreement: 'ACE58', importer: 'PE', exporter: 'AR', hs6: '100199', prefRate: 0, mfnRate: 7, staging: 'A' },
  { agreement: 'ACE58', importer: 'PE', exporter: 'AR', hs6: '120190', prefRate: 0, mfnRate: 4, staging: 'A' },
  { agreement: 'ACE58', importer: 'PE', exporter: 'BR', hs6: '870322', prefRate: 0, mfnRate: 9, staging: 'A' },

  // Israel-MERCOSUR
  { agreement: 'ISRAEL_MERCOSUR', importer: 'IL', exporter: 'AR', hs6: '020130', prefRate: 0, mfnRate: 23, staging: 'A' },
  { agreement: 'ISRAEL_MERCOSUR', importer: 'IL', exporter: 'AR', hs6: '220421', prefRate: 0, mfnRate: 40, staging: 'A' },
];

export async function loadAgreements(): Promise<void> {
  const existing = (db.prepare(
    'SELECT COUNT(*) as c FROM trade_agreements'
  ).get() as any).c;

  if (existing >= AGREEMENTS.length) {
    logger.info(`[agreements] ${existing} tratados ya cargados`);
    return;
  }

  logger.info('[agreements] Cargando tratados comerciales...');

  // Insertar tratados
  const stmtAgreement = db.prepare(`
    INSERT OR IGNORE INTO trade_agreements
      (code, name_es, name_en, name_pt, agreement_type, status,
       signed_date, in_force_date, official_url, notes_es, notes_en)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Insertar miembros
  const stmtMember = db.prepare(`
    INSERT OR IGNORE INTO agreement_members (agreement_code, country_code)
    VALUES (?, ?)
  `);

  // Insertar tasas
  const stmtRate = db.prepare(`
    INSERT OR IGNORE INTO agreement_rates
      (agreement_code, importer_country, exporter_country, hs6,
       preferential_rate, mfn_rate, staging_category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAll = db.transaction(() => {
    for (const ag of AGREEMENTS) {
      stmtAgreement.run(
        ag.code, ag.name_es, ag.name_en, ag.name_pt || null,
        ag.type, ag.status, ag.signed, ag.in_force || null,
        ag.url, ag.notes_es, ag.notes_en
      );
      for (const country of ag.members) {
        stmtMember.run(ag.code, country);
      }
    }

    for (const rate of AGREEMENT_RATES) {
      stmtRate.run(
        rate.agreement, rate.importer, rate.exporter,
        rate.hs6, rate.prefRate, rate.mfnRate, rate.staging
      );
    }
  });

  insertAll();
  logger.info(`[agreements] ✅ ${AGREEMENTS.length} tratados y ${AGREEMENT_RATES.length} tasas cargados`);

  // Intentar sincronizar con WTO RTA en background
  syncWithWtoRta().catch(e =>
    logger.warn('[agreements] Sync WTO RTA falló', { error: e.message })
  );
}

async function syncWithWtoRta(): Promise<void> {
  // WTO Regional Trade Agreements Database API
  // https://rtais.wto.org/api/publicgetallrta
  try {
    const response = await fetch('https://rtais.wto.org/api/publicgetallrta');
    if (!response.ok) throw new Error(`WTO RTA: ${response.status}`);

    const data = await response.json();
    logger.info(`[agreements] WTO RTA: ${data?.length || 0} tratados disponibles`);

    // Actualizar wto_rta_id para los tratados que ya tenemos
    if (Array.isArray(data)) {
      for (const rta of data) {
        const name = rta.Name || rta.name || '';
        if (name.includes('MERCOSUR') || name.includes('Mercosur')) {
          db.prepare(
            'UPDATE trade_agreements SET wto_rta_id = ? WHERE code = ?'
          ).run(String(rta.RtaId || rta.id), 'MERCOSUR');
        }
        // ... más matches
      }
    }

    // Guardar en cache
    db.prepare(`
      INSERT OR REPLACE INTO wto_rta_cache (cache_key, data, expires_at)
      VALUES ('all_rtas', ?, ?)
    `).run(JSON.stringify(data), Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60);

    logger.info('[agreements] ✅ WTO RTA sincronizado');
  } catch (error) {
    throw error;
  }
}
