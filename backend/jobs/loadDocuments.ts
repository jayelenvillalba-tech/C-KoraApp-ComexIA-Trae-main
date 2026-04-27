import Database from 'better-sqlite3';
import path from 'path';
import { logger } from '../services/logger.js';

const db = new Database(path.join(process.cwd(), 'comexia_v2.db'));

// ── DOCUMENTOS POR RUTA ───────────────────────────────────────────
// Nivel 1: VERIFICADOS (AR, BR, UE, USA, CN — revisados manualmente)
// Nivel 2: SEMI-VERIFICADOS (LatAm — generados y revisados)
// Nivel 3: IA (resto del mundo — generados por Groq con badge)

const ROUTE_DOCUMENTS = [
  // ══ ARGENTINA → CUALQUIER DESTINO (documentos base) ══
  {
    origin: 'AR', dest: '*', hs6: null, agreement: null,
    name: 'Permiso de Embarque (PE) — AFIP SIM',
    nameEn: 'Export Permit — AFIP SIM System',
    type: 'customs',
    mandatory: true,
    issuingBody: 'AFIP',
    issuingUrl: 'https://www.afip.gob.ar/sim',
    validityDays: 30,
    costUsd: 0,
    processingDays: 1,
    confidence: 'verified',
    notesEs: 'Declaración electrónica obligatoria antes de cada embarque. Se gestiona en AFIP SIM.',
    notesEn: 'Mandatory electronic declaration before each shipment. Managed in AFIP SIM.',
  },
  {
    origin: 'AR', dest: '*', hs6: null, agreement: null,
    name: 'Factura Comercial de Exportación (E)',
    nameEn: 'Commercial Export Invoice',
    type: 'commercial',
    mandatory: true,
    issuingBody: 'Empresa exportadora',
    issuingUrl: null,
    validityDays: null,
    costUsd: 0,
    processingDays: 1,
    confidence: 'verified',
    notesEs: 'Emitida por el exportador. Debe incluir: descripción, NCM, valor FOB, Incoterm, país de destino.',
    notesEn: 'Issued by the exporter. Must include: description, NCM, FOB value, Incoterm, destination country.',
  },
  {
    origin: 'AR', dest: '*', hs6: null, agreement: null,
    name: 'Packing List (Lista de Empaque)',
    nameEn: 'Packing List',
    type: 'commercial',
    mandatory: true,
    issuingBody: 'Empresa exportadora',
    issuingUrl: null,
    validityDays: null,
    costUsd: 0,
    processingDays: 1,
    confidence: 'verified',
    notesEs: 'Detalle de bultos, pesos y medidas. Obligatorio para despacho.',
    notesEn: 'Detail of packages, weights and dimensions. Required for customs clearance.',
  },

  // ══ ARGENTINA → BRASIL (MERCOSUR) ══
  {
    origin: 'AR', dest: 'BR', hs6: null, agreement: 'MERCOSUR',
    name: 'Certificado de Origen MERCOSUR (Formulario M)',
    nameEn: 'MERCOSUR Certificate of Origin (Form M)',
    type: 'origin_cert',
    mandatory: true,
    issuingBody: 'Cámaras habilitadas MERCOSUR',
    issuingUrl: 'https://www.mercosur.int/temas/certificado-de-origen/',
    validityDays: 180,
    costUsd: 15,
    processingDays: 2,
    confidence: 'verified',
    notesEs: 'Obligatorio para acceder a arancel 0% intrazona. Emitido por Cámara de Comercio habilitada. Válido 180 días.',
    notesEn: 'Required for 0% intra-zone tariff. Issued by authorized Chamber of Commerce. Valid 180 days.',
  },
  {
    origin: 'AR', dest: 'BR', hs6: '020130', agreement: null,
    name: 'Certificado Sanitario SENASA para Carne Bovina',
    nameEn: 'SENASA Sanitary Certificate for Bovine Meat',
    type: 'sanitary',
    mandatory: true,
    issuingBody: 'SENASA',
    issuingUrl: 'https://www.argentina.gob.ar/senasa/exportaciones',
    validityDays: 30,
    costUsd: 50,
    processingDays: 5,
    confidence: 'verified',
    notesEs: 'Obligatorio para carnes. El establecimiento debe estar habilitado SENASA para exportación. BR exige certificado bilateral específico.',
    notesEn: 'Required for meat. Establishment must be SENASA-approved for export. BR requires specific bilateral certificate.',
  },

  // ══ ARGENTINA → UNIÓN EUROPEA ══
  {
    origin: 'AR', dest: 'DE', hs6: null, agreement: 'SGP_EU',
    name: 'Certificado de Origen SGP (Formulario A o REX)',
    nameEn: 'GSP Certificate of Origin (Form A or REX)',
    type: 'origin_cert',
    mandatory: true,
    issuingBody: 'AFIP / DGA',
    issuingUrl: 'https://www.afip.gob.ar/aduanaSecreta/certificadoOrigen/',
    validityDays: 180,
    costUsd: 20,
    processingDays: 3,
    confidence: 'verified',
    notesEs: 'Para acceder a preferencias del SGP europeo. Desde 2017 se usa REX (Registered Exporter System) en lugar del Formulario A para exportaciones >6.000 EUR.',
    notesEn: 'To access EU GSP preferences. Since 2017, REX (Registered Exporter System) replaced Form A for exports >EUR 6,000.',
  },
  {
    origin: 'AR', dest: 'DE', hs6: '020130', agreement: null,
    name: 'Certificado Sanitario SENASA para UE',
    nameEn: 'SENASA Sanitary Certificate for EU',
    type: 'sanitary',
    mandatory: true,
    issuingBody: 'SENASA',
    issuingUrl: 'https://www.argentina.gob.ar/senasa/exportaciones/union-europea',
    validityDays: 30,
    costUsd: 80,
    processingDays: 7,
    confidence: 'verified',
    notesEs: 'El establecimiento debe estar en la lista positiva de la UE. SENASA emite el certificado en formato EUR oficial.',
    notesEn: 'Establishment must be on EU positive list. SENASA issues certificate in official EU format.',
  },
  {
    origin: 'AR', dest: 'DE', hs6: '120190', agreement: null,
    name: 'Certificado Fitosanitario SENASA para Soja',
    nameEn: 'SENASA Phytosanitary Certificate for Soybeans',
    type: 'phyto',
    mandatory: true,
    issuingBody: 'SENASA',
    issuingUrl: 'https://www.argentina.gob.ar/senasa',
    validityDays: 30,
    costUsd: 30,
    processingDays: 3,
    confidence: 'verified',
    notesEs: 'Obligatorio para granos y oleaginosas. Certifica ausencia de plagas cuarentenarias. UE exige declaración adicional de OGM.',
    notesEn: 'Required for grains and oilseeds. Certifies absence of quarantine pests. EU requires additional GMO declaration.',
  },
  {
    origin: 'AR', dest: 'DE', hs6: '120190', agreement: null,
    name: 'Declaración de OGM (Organismos Genéticamente Modificados)',
    nameEn: 'GMO Declaration (Genetically Modified Organisms)',
    type: 'technical',
    mandatory: true,
    issuingBody: 'SENASA / Laboratorio acreditado',
    issuingUrl: 'https://www.efsa.europa.eu',
    validityDays: 90,
    costUsd: 150,
    processingDays: 10,
    confidence: 'verified',
    notesEs: 'La UE exige declaración/análisis de OGM para soja. Si es OGM, debe estar autorizado en la lista UE. Si es no-OGM, requiere análisis de laboratorio acreditado.',
    notesEn: 'EU requires GMO declaration/analysis for soybeans. If GMO, must be on EU authorized list. If non-GMO, requires accredited lab analysis.',
  },

  // ══ ARGENTINA → CHINA ══
  {
    origin: 'AR', dest: 'CN', hs6: '120190', agreement: null,
    name: 'Registro GACC del Establecimiento Exportador',
    nameEn: 'GACC Registration of Exporting Establishment',
    type: 'technical',
    mandatory: true,
    issuingBody: 'GACC (General Administration of Customs of China)',
    issuingUrl: 'http://www.customs.gov.cn',
    validityDays: 1825, // 5 años
    costUsd: 200,
    processingDays: 90,
    confidence: 'verified',
    notesEs: 'OBLIGATORIO desde 2022 para alimentos exportados a China. El establecimiento (planta, silo, frigorífico) debe estar registrado en GACC. Demora 3-6 meses.',
    notesEn: 'MANDATORY since 2022 for foods exported to China. The establishment (plant, silo, cold storage) must be GACC-registered. Takes 3-6 months.',
  },
  {
    origin: 'AR', dest: 'CN', hs6: '120190', agreement: null,
    name: 'Certificado Fitosanitario SENASA para China',
    nameEn: 'SENASA Phytosanitary Certificate for China',
    type: 'phyto',
    mandatory: true,
    issuingBody: 'SENASA',
    issuingUrl: 'https://www.argentina.gob.ar/senasa',
    validityDays: 14,
    costUsd: 30,
    processingDays: 3,
    confidence: 'verified',
    notesEs: 'China exige certificado fitosanitario específico bilateral AR-CN. Válido solo 14 días desde emisión. Protocolo específico para soja AR-CN firmado.',
    notesEn: 'China requires specific bilateral AR-CN phytosanitary certificate. Valid only 14 days from issuance. Specific AR-CN soybean protocol signed.',
  },
  {
    origin: 'AR', dest: 'CN', hs6: '020130', agreement: null,
    name: 'Habilitación Frigorífico SENASA-GACC',
    nameEn: 'Cold Storage SENASA-GACC Approval',
    type: 'sanitary',
    mandatory: true,
    issuingBody: 'SENASA + GACC',
    issuingUrl: 'https://www.argentina.gob.ar/senasa',
    validityDays: 1825,
    costUsd: 500,
    processingDays: 180,
    confidence: 'verified',
    notesEs: 'El frigorífico debe estar habilitado por SENASA Y registrado en GACC. Lista de establecimientos habilitados publicada por GACC.',
    notesEn: 'Cold storage must be SENASA-approved AND GACC-registered. List of approved establishments published by GACC.',
  },

  // ══ ARGENTINA → ESTADOS UNIDOS ══
  {
    origin: 'AR', dest: 'US', hs6: null, agreement: null,
    name: 'FDA Prior Notice (Aviso Previo FDA)',
    nameEn: 'FDA Prior Notice',
    type: 'customs',
    mandatory: true,
    issuingBody: 'FDA (Food and Drug Administration)',
    issuingUrl: 'https://www.access.fda.gov',
    validityDays: null,
    costUsd: 0,
    processingDays: 1,
    confidence: 'verified',
    notesEs: 'Para alimentos: el importador americano debe notificar a la FDA antes del arribo. Se hace online en access.fda.gov. Lo gestiona el importador en USA, no el exportador AR.',
    notesEn: 'For food: the US importer must notify FDA before arrival. Done online at access.fda.gov. Managed by the US importer, not the AR exporter.',
  },
  {
    origin: 'AR', dest: 'US', hs6: '020130', agreement: null,
    name: 'FSIS Import Inspection — USDA',
    nameEn: 'FSIS Import Inspection — USDA',
    type: 'sanitary',
    mandatory: true,
    issuingBody: 'USDA FSIS',
    issuingUrl: 'https://www.fsis.usda.gov',
    validityDays: null,
    costUsd: 0,
    processingDays: 1,
    confidence: 'verified',
    notesEs: 'Toda carne importada a USA es inspeccionada por USDA FSIS en el puerto de entrada. AR tiene equivalencia sanitaria reconocida por USA. El establecimiento debe estar en la lista FSIS.',
    notesEn: 'All meat imported to USA is inspected by USDA FSIS at the port of entry. AR has sanitary equivalence recognized by USA. Establishment must be on FSIS list.',
  },

  // ══ BRASIL → CUALQUIER DESTINO ══
  {
    origin: 'BR', dest: '*', hs6: null, agreement: null,
    name: 'Registro de Exportação (RE) — Siscomex',
    nameEn: 'Export Registration (RE) — Siscomex',
    type: 'customs',
    mandatory: true,
    issuingBody: 'Receita Federal / Siscomex',
    issuingUrl: 'https://www.gov.br/receitafederal',
    validityDays: null,
    costUsd: 0,
    processingDays: 1,
    confidence: 'verified',
    notesEs: 'Obligatorio para toda exportación brasileña. Se gestiona electrónicamente en Siscomex.',
    notesEn: 'Required for all Brazilian exports. Managed electronically in Siscomex.',
  },
  {
    origin: 'BR', dest: '*', hs6: null, agreement: null,
    name: 'Nota Fiscal Eletrônica de Exportação (NF-e)',
    nameEn: 'Electronic Export Tax Invoice (NF-e)',
    type: 'commercial',
    mandatory: true,
    issuingBody: 'SEFAZ',
    issuingUrl: 'https://www.nfe.fazenda.gov.br',
    validityDays: null,
    costUsd: 0,
    processingDays: 1,
    confidence: 'verified',
    notesEs: 'Equivalente brasileño de la factura electrónica. CFOP de exportación 7000-7999.',
    notesEn: 'Brazilian equivalent of the electronic invoice. Export CFOP 7000-7999.',
  },

  // ══ BRASIL → CHINA ══
  {
    origin: 'BR', dest: 'CN', hs6: '120190', agreement: null,
    name: 'Registro GACC Brasil — Estabelecimento Exportador',
    nameEn: 'GACC Brazil Registration — Exporting Establishment',
    type: 'technical',
    mandatory: true,
    issuingBody: 'GACC + MAPA Brasil',
    issuingUrl: 'http://www.customs.gov.cn',
    validityDays: 1825,
    costUsd: 200,
    processingDays: 90,
    confidence: 'verified',
    notesEs: 'Igual que para Argentina. GACC es obligatorio para exportar alimentos a China desde 2022.',
    notesEn: 'Same as Argentina. GACC registration is mandatory to export food to China since 2022.',
  },
];

export async function loadRouteDocuments(): Promise<void> {
  const existing = (db.prepare(
    'SELECT COUNT(*) as c FROM route_documents'
  ).get() as any).c;

  if (existing > 50) {
    logger.info(`[documents] ${existing} documentos ya cargados`);
    return;
  }

  logger.info('[documents] Cargando documentos de ruta verificados...');

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO route_documents
      (origin_country, dest_country, hs6, agreement_code,
       doc_name, doc_name_en, doc_type, is_mandatory,
       issuing_body, issuing_body_url, validity_days,
       cost_usd, processing_days, confidence_level,
       last_verified, notes_es, notes_en)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAll = db.transaction(() => {
    for (const doc of ROUTE_DOCUMENTS) {
      stmt.run(
        doc.origin, doc.dest === '*' ? null : doc.dest,
        doc.hs6, doc.agreement,
        doc.name, doc.nameEn, doc.type, doc.mandatory ? 1 : 0,
        doc.issuingBody, doc.issuingUrl,
        doc.validityDays, doc.costUsd, doc.processingDays,
        doc.confidence, new Date().toISOString().split('T')[0],
        doc.notesEs, doc.notesEn
      );
    }
  });

  insertAll();
  logger.info(`[documents] ✅ ${ROUTE_DOCUMENTS.length} documentos verificados cargados`);
}
