import Database from 'better-sqlite3';
import path from 'path';
import { logger } from '../services/logger.js';
import Groq from 'groq-sdk';

const db = new Database(path.join(process.cwd(), 'comexia_v2.db'));
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface RouteAnalysis {
  route: {
    origin: string;
    destination: string;
    hsCode: string;
    productName: string;
  };
  agreements: {
    applicable: AgreementMatch[];
    bestOption: AgreementMatch | null;
    noAgreement: boolean;
  };
  tariff: {
    mfnRate: number | null;
    preferentialRate: number | null;
    effectiveRate: number;
    saving: number;
    treatyUsed: string | null;
  };
  documents: {
    required: DocumentRequirement[];
    conditional: DocumentRequirement[];
    totalCostUsd: number;
    totalProcessingDays: number;
    criticalPath: string[];  // documentos que más demoran
    dataSource: 'verified' | 'semi' | 'ai_generated';
  };
  warnings: string[];
}

interface AgreementMatch {
  code: string;
  name: string;
  status: string;
  preferentialRate: number | null;
  requiredDocument: string | null;
  notes: string;
}

interface DocumentRequirement {
  name: string;
  nameEn: string;
  type: string;
  isMandatory: boolean;
  issuingBody: string;
  issuingUrl: string | null;
  validityDays: number | null;
  costUsd: number;
  processingDays: number;
  confidence: string;
  notes: string;
}

export async function analyzeRoute(
  origin: string,
  destination: string,
  hsCode: string,
  userLanguage: string = 'es'
): Promise<RouteAnalysis> {
  const hs6 = hsCode.replace(/\./g, '').substring(0, 6);

  // ── 1. ENCONTRAR TRATADOS APLICABLES ─────────────────────────────
  const applicableAgreements = findApplicableAgreements(origin, destination, hs6);

  // ── 2. CALCULAR ARANCEL EFECTIVO ──────────────────────────────────
  const tariffInfo = calculateEffectiveTariff(origin, destination, hs6, applicableAgreements);

  // ── 3. OBTENER DOCUMENTOS REQUERIDOS ─────────────────────────────
  const documents = await getRequiredDocuments(origin, destination, hs6, applicableAgreements);

  // ── 4. GENERAR WARNINGS ──────────────────────────────────────────
  const warnings = generateWarnings(origin, destination, hs6, applicableAgreements, documents);

  // ── 5. OBTENER NOMBRE DEL PRODUCTO ───────────────────────────────
  const product = db.prepare(
    'SELECT desc_es, desc_en FROM hs_codes_global WHERE hs6 = ? LIMIT 1'
  ).get(hs6) as any;

  return {
    route: {
      origin,
      destination,
      hsCode: hs6,
      productName: userLanguage === 'es'
        ? (product?.desc_es || hs6)
        : (product?.desc_en || hs6),
    },
    agreements: {
      applicable: applicableAgreements,
      bestOption: applicableAgreements.find(a => a.preferentialRate !== null) || null,
      noAgreement: applicableAgreements.length === 0,
    },
    tariff: tariffInfo,
    documents,
    warnings,
  };
}

function findApplicableAgreements(
  origin: string,
  destination: string,
  hs6: string
): AgreementMatch[] {
  // Buscar tratados donde AMBOS países son miembros
  const agreements = db.prepare(`
    SELECT DISTINCT
      ta.code, ta.name_es, ta.name_en, ta.status, ta.notes_es, ta.notes_en,
      ar.preferential_rate
    FROM trade_agreements ta
    JOIN agreement_members am1 ON am1.agreement_code = ta.code AND am1.country_code = ?
    JOIN agreement_members am2 ON am2.agreement_code = ta.code AND am2.country_code = ?
    LEFT JOIN agreement_rates ar ON
      ar.agreement_code = ta.code AND
      ar.importer_country = ? AND
      ar.exporter_country = ? AND
      (ar.hs6 = ? OR ar.hs6 = SUBSTR(?, 1, 4) OR ar.hs6 = SUBSTR(?, 1, 2))
    WHERE ta.status IN ('active', 'pending')
    ORDER BY ta.status = 'active' DESC, ar.preferential_rate ASC
  `).all(origin, destination, destination, origin, hs6, hs6, hs6) as any[];

  return agreements.map(ag => ({
    code: ag.code,
    name: ag.name_es,
    status: ag.status,
    preferentialRate: ag.preferential_rate,
    requiredDocument: getRequiredOriginCert(ag.code),
    notes: ag.notes_es || '',
  }));
}

function getRequiredOriginCert(agreementCode: string): string | null {
  const certs: Record<string, string> = {
    'MERCOSUR': 'Certificado de Origen MERCOSUR (Formulario M)',
    'SGP_EU': 'Certificado de Origen SGP (Formulario A o REX)',
    'SGP_US': 'Certificado de Origen GSP (Formulario A)',
    'ACE35': 'Certificado de Origen ALADI',
    'ACE58': 'Certificado de Origen ALADI',
    'CPTPP': 'Certificado de Origen CPTPP',
    'RCEP': 'Certificado de Origen RCEP',
    'USMCA': 'Certificación de Origen USMCA (autodetección)',
    'ISRAEL_MERCOSUR': 'Certificado de Origen MERCOSUR-Israel',
  };
  return certs[agreementCode] || null;
}

function calculateEffectiveTariff(
  origin: string,
  destination: string,
  hs6: string,
  agreements: AgreementMatch[]
): RouteAnalysis['tariff'] {
  // Obtener arancel MFN del destino
  const hsData = db.prepare(
    'SELECT arancel_taric, arancel_hts, arancel_mercosur FROM hs_codes_global WHERE hs6 = ? LIMIT 1'
  ).get(hs6) as any;

  const isEU = ['DE','FR','ES','IT','NL','BE','PT','AT','SE','PL','IE'].includes(destination);
  const isUS = destination === 'US';
  const isMercosur = ['AR','BR','UY','PY'].includes(destination);

  let mfnRate = isEU ? hsData?.arancel_taric
    : isUS ? hsData?.arancel_hts
    : isMercosur ? hsData?.arancel_mercosur
    : null;

  // Encontrar la tasa preferencial más baja entre los tratados activos
  const bestRate = agreements
    .filter(a => a.status === 'active' && a.preferentialRate !== null)
    .reduce((best: number | null, a) => {
      if (best === null) return a.preferentialRate;
      return a.preferentialRate! < best ? a.preferentialRate : best;
    }, null);

  const treatyUsed = bestRate !== null
    ? agreements.find(a => a.preferentialRate === bestRate)?.code || null
    : null;

  const effectiveRate = bestRate !== null ? bestRate : (mfnRate || 0);
  const saving = mfnRate !== null && bestRate !== null ? mfnRate - bestRate : 0;

  return {
    mfnRate,
    preferentialRate: bestRate,
    effectiveRate,
    saving,
    treatyUsed,
  };
}

async function getRequiredDocuments(
  origin: string,
  destination: string,
  hs6: string,
  agreements: AgreementMatch[]
): Promise<RouteAnalysis['documents']> {

  // Buscar documentos verificados en la DB
  const verifiedDocs = db.prepare(`
    SELECT * FROM route_documents
    WHERE
      (origin_country = ? OR origin_country IS NULL)
      AND (dest_country = ? OR dest_country IS NULL)
      AND (hs6 = ? OR hs6 = SUBSTR(?, 1, 4) OR hs6 IS NULL)
    ORDER BY is_mandatory DESC, doc_type ASC
  `).all(origin, destination, hs6, hs6) as any[];

  // Agregar certificado de origen del mejor tratado
  const bestAgreement = agreements.find(a => a.status === 'active' && a.requiredDocument);
  if (bestAgreement?.requiredDocument) {
    const originCertExists = verifiedDocs.some(d => d.doc_type === 'origin_cert');
    if (!originCertExists) {
      verifiedDocs.push({
        doc_name: bestAgreement.requiredDocument,
        doc_type: 'origin_cert',
        is_mandatory: 1,
        issuing_body: 'Cámara de Comercio / AFIP',
        validity_days: 180,
        cost_usd: 15,
        processing_days: 2,
        confidence_level: 'verified',
        notes_es: `Requerido para acceder a preferencias arancelarias del ${bestAgreement.name}`,
      });
    }
  }

  // Si hay pocos documentos verificados → generar con Groq
  let dataSource: 'verified' | 'semi' | 'ai_generated' = 'verified';

  if (verifiedDocs.length < 2) {
    dataSource = 'ai_generated';
    const aiDocs = await generateDocumentsWithGroq(origin, destination, hs6);
    verifiedDocs.push(...aiDocs);
  } else if (verifiedDocs.some(d => d.confidence_level === 'semi')) {
    dataSource = 'semi';
  }

  const required = verifiedDocs.filter(d => d.is_mandatory === 1);
  const conditional = verifiedDocs.filter(d => d.is_mandatory === 0);

  const totalCost = required.reduce((sum, d) => sum + (d.cost_usd || 0), 0);
  const maxProcessing = Math.max(...required.map(d => d.processing_days || 0), 0);

  const criticalPath = required
    .filter(d => d.processing_days && d.processing_days > 5)
    .sort((a, b) => (b.processing_days || 0) - (a.processing_days || 0))
    .map(d => d.doc_name)
    .slice(0, 3);

  const mapDoc = (d: any): DocumentRequirement => ({
    name: d.doc_name,
    nameEn: d.doc_name_en || d.doc_name,
    type: d.doc_type,
    isMandatory: d.is_mandatory === 1,
    issuingBody: d.issuing_body,
    issuingUrl: d.issuing_body_url || null,
    validityDays: d.validity_days,
    costUsd: d.cost_usd || 0,
    processingDays: d.processing_days || 1,
    confidence: d.confidence_level || 'ai_generated',
    notes: d.notes_es || '',
  });

  return {
    required: required.map(mapDoc),
    conditional: conditional.map(mapDoc),
    totalCostUsd: totalCost,
    totalProcessingDays: maxProcessing,
    criticalPath,
    dataSource,
  };
}

async function generateDocumentsWithGroq(
  origin: string,
  destination: string,
  hs6: string
): Promise<any[]> {
  // Obtener nombre del producto
  const product = db.prepare(
    'SELECT desc_es FROM hs_codes_global WHERE hs6 = ? LIMIT 1'
  ).get(hs6) as any;

  const prompt = `Sos un experto en comercio exterior y documentación aduanera.

Para la exportación de: ${product?.desc_es || `producto HS ${hs6}`}
Desde: ${origin} → Hacia: ${destination}
Código HS: ${hs6}

Devolvé SOLO JSON array con los documentos requeridos:
[{
  "doc_name": "nombre oficial del documento",
  "doc_name_en": "official name in English",
  "doc_type": "customs|sanitary|phyto|origin_cert|commercial|technical",
  "is_mandatory": 1,
  "issuing_body": "organismo que lo emite",
  "issuing_body_url": "URL del organismo o null",
  "validity_days": número o null,
  "cost_usd": número,
  "processing_days": número,
  "confidence_level": "semi",
  "notes_es": "explicación breve para una PyME"
}]

Máximo 6 documentos. Solo los más importantes. Sin texto adicional.`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 800,
      temperature: 0.1,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '[]';
    const clean = raw.replace(/```json?/gi, '').replace(/```/g, '').trim();
    const docs = JSON.parse(clean);

    // Guardar en DB para próximas consultas
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO route_documents
        (origin_country, dest_country, hs6, doc_name, doc_name_en,
         doc_type, is_mandatory, issuing_body, issuing_body_url,
         validity_days, cost_usd, processing_days, confidence_level,
         last_verified, notes_es)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ai_generated', date('now'), ?)
    `);

    const insertAll = db.transaction(() => {
      for (const doc of docs) {
        stmt.run(
          origin, destination, hs6,
          doc.doc_name, doc.doc_name_en, doc.doc_type,
          doc.is_mandatory, doc.issuing_body, doc.issuing_body_url,
          doc.validity_days, doc.cost_usd, doc.processing_days,
          doc.notes_es
        );
      }
    });

    insertAll();
    return docs;
  } catch (error) {
    logger.error('[routeAnalysis] Groq error', { error: (error as Error).message });
    return [];
  }
}

function generateWarnings(
  origin: string,
  destination: string,
  hs6: string,
  agreements: AgreementMatch[],
  documents: RouteAnalysis['documents']
): string[] {
  const warnings: string[] = [];

  // Warning: tratado pendiente de ratificación
  const pending = agreements.find(a => a.status === 'pending');
  if (pending) {
    warnings.push(`El acuerdo ${pending.name} está firmado pero PENDIENTE de ratificación. Los aranceles mostrados son proyectados, no vigentes aún.`);
  }

  // Warning: AR excluida del GSP USA
  if (origin === 'AR' && destination === 'US') {
    warnings.push('Argentina fue excluida del Sistema Generalizado de Preferencias (SGP) de USA en 2012. Los aranceles se aplican a tasa MFN.');
  }

  // Warning: GACC China obligatorio para alimentos
  if (destination === 'CN' && parseInt(hs6.substring(0, 2)) <= 24) {
    warnings.push('⚠️ GACC OBLIGATORIO: Para exportar alimentos a China, el establecimiento exportador debe estar registrado en GACC. El proceso toma 3-6 meses. Verificar habilitación antes de negociar.');
  }

  // Warning: tiempo crítico de documentación
  if (documents.totalProcessingDays > 30) {
    warnings.push(`La documentación para esta ruta requiere hasta ${documents.totalProcessingDays} días de procesamiento. Iniciá los trámites con anticipación.`);
  }

  // Warning: datos generados por IA
  if (documents.dataSource === 'ai_generated') {
    warnings.push('📋 Los documentos mostrados fueron generados por IA. Verificar con un despachante de aduana habilitado antes de operar.');
  }

  // Warning: RCEP — competidores con ventaja
  if (destination === 'CN' && ['AU', 'NZ', 'VN', 'TH'].includes(origin)) {
    // No aplica directamente pero si origin es AR mostrar la desventaja
  }
  if (destination === 'CN' && origin === 'AR') {
    warnings.push('⚡ OPORTUNIDAD: AR no tiene TLC con China. Sin embargo, bajo el protocolo bilateral AR-CN, la soja argentina tiene acceso preferencial de facto. Competidores australianos tienen ventaja RCEP.');
  }

  return warnings;
}
