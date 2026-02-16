
import { db as exportedDb, initDatabase } from '../../database/db-sqlite.js';
import { regulatoryRules } from '../../shared/schema-sqlite.js';
import { countries } from '../../shared/countries-data.js';
import { eq, or, and, isNull, inArray } from 'drizzle-orm';
import { SanctionsService } from './sanctions-service.js';

export class RegulatoryEngine {

  static async determineRequiredDocuments(hsCode: string, country: string, originCountry?: string): Promise<any[]> {
    // Ensure database is initialized
    const db = await initDatabase();
    
    // 1. BASE DOCUMENTS (Universal)
    const commonDocs: any[] = [
      {
        name: 'Factura Comercial',
        issuer: 'Exportador',
        description: 'Documento comercial que detalla la transacción.',
        requirements: 'Debe incluir Incoterms, descripción detallada, valor unitario y total.'
      },
      {
        name: 'Lista de Empaque (Packing List)',
        issuer: 'Exportador',
        description: 'Detalle del contenido de cada bulto.',
        requirements: 'Debe coincidir exactamente con la factura comercial.'
      },
      {
        name: 'Documento de Transporte',
        issuer: 'Transportista / Agente de Carga',
        description: 'Bill of Lading (marítimo), Air Waybill (aéreo) o CRT (terrestre).',
        requirements: 'Debe estar consignado según instrucciones del importador.'
      }
    ];

    const chapter = hsCode ? hsCode.substring(0, 2) : null;
    const countryUpper = country ? country.toUpperCase() : '';

    // 2. REGIONAL & COUNTRY-SPECIFIC LOGIC (Smart Base Docs)
    const euCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'PL', 'AT', 'DK', 'FI', 'IE', 'PT', 'GR', 'CZ', 'HU', 'RO', 'BG', 'SK', 'HR', 'LT', 'SI', 'LV', 'EE', 'CY', 'LU', 'MT'];
    
    // European Union Logic
    if (euCountries.includes(countryUpper)) {
      commonDocs.push({
        name: 'Documento Único Administrativo (DUA/SAD)',
        issuer: 'Aduana de Destino / Importador',
        description: 'Declaración aduanera estándar para toda la Unión Europea.',
        requirements: 'Debe presentarse electrónicamente antes de la llegada.'
      });
      commonDocs.push({
        name: 'Declaración de Conformidad CE',
        issuer: 'Fabricante',
        description: 'Certifica que el producto cumple con las normas de seguridad de la UE.',
        requirements: 'Obligatorio para electrónica, maquinaria y juguetes.'
      });
    }

    // MERCOSUR Logic
    if (['AR', 'BR', 'PY', 'UY', 'BO'].includes(countryUpper)) {
      commonDocs.push({
        name: 'Certificado de Origen MERCOSUR',
        issuer: 'Cámara de Comercio',
        description: 'Permite la exoneración del Arancel Externo Común.',
        requirements: 'Formato oficial MERCOSUR, sin enmiendas.'
      });
    }

    // ASEAN Logic (Vietnam, Thailand, Indonesia, etc.)
    if (['VN', 'TH', 'ID', 'MY', 'PH', 'SG'].includes(countryUpper)) {
      commonDocs.push({
        name: 'Formulario D (ATIGA)',
        issuer: 'Autoridad Comercial',
        description: 'Certificado de origen para preferencias arancelarias en ASEAN.',
        requirements: 'Original firmado, emitido antes del embarque.'
      });
    }

    // China Specific
    if (countryUpper === 'CN') {
      if (chapter && ['02', '03', '04', '08', '09', '10', '12', '16', '19', '20', '21', '22'].includes(chapter)) {
        commonDocs.push({
          name: 'Registro GACC (CIFER)',
          issuer: 'GACC (Aduana China)',
          description: 'Registro obligatorio para exportadores de alimentos.',
          requirements: 'El número de registro debe figurar en el etiquetado.'
        });
      }
    }

    // USA Specific (ISF + FDA)
    if (['US', 'USA'].includes(countryUpper)) {
      commonDocs.push({
        name: 'ISF (10+2) Filing',
        issuer: 'Importador / Agente',
        description: 'Información de seguridad del importador (Importer Security Filing).',
        requirements: 'Debe presentarse 24 horas antes de la carga en origen (marítimo).'
      });
      if (chapter && ['02', '03', '04', '07', '08', '09', '10', '11', '12', '17', '18', '19', '20', '21', '22'].includes(chapter)) {
        commonDocs.push({
          name: 'FDA Prior Notice',
          issuer: 'FDA / Agente',
          description: 'Notificación previa de alimentos importados.',
          requirements: 'El número de confirmación debe estar en la factura comercial.'
        });
      }
    }

    // 3. PRODUCT-SPECIFIC LOGIC (HS Chapters)
    if (chapter) {
      // Animal Products (Chapters 01-05)
      if (['01', '02', '03', '04', '05'].includes(chapter)) {
        commonDocs.push({
          name: 'Certificado Sanitario / Veterinario',
          issuer: 'Autoridad Sanitaria Oficial (ej. SENASA)',
          description: 'Acredita que los productos son aptos para consumo humano/animal.',
          requirements: 'Debe ser emitido por la autoridad oficial del país exportador.'
        });
      }

      // Textiles (Chapters 61-62)
      if (['61', '62'].includes(chapter)) {
        commonDocs.push({
          name: 'Certificado de Composición',
          issuer: 'Fabricante / Laboratorio',
          description: 'Detalla la composición de las fibras (ej. 100% algodón).',
          requirements: 'Obligatorio para etiquetado en destino.'
        });
      }

      // Chemicals (Chapters 28, 29, 38)
      if (['28', '29', '38'].includes(chapter)) {
        commonDocs.push({
          name: 'MSDS (Hoja de Seguridad)',
          issuer: 'Fabricante',
          description: 'Detalla el manejo seguro de sustancias químicas.',
          requirements: 'Debe cumplir norma GHS y estar en idiomas oficiales.'
        });
        if (euCountries.includes(countryUpper)) {
          commonDocs.push({
            name: 'Registro REACH',
            issuer: 'ECHA (UE)',
            description: 'Registro de sustancias químicas en la Unión Europea.',
            requirements: 'Número de registro REACH obligatorio en la factura.'
          });
        }
      }

      // Pharma (Chapter 30)
      if (chapter === '30') {
        commonDocs.push({
          name: 'Certificado GMP / BPF',
          issuer: 'Autoridad Sanitaria (ANMAT/FDA/EMA)',
          description: 'Buenas Prácticas de Manufactura (Good Manufacturing Practices).',
          requirements: 'Certificado vigente y legalizado.'
        });
        commonDocs.push({
          name: 'Certificado de Registro de Producto',
          issuer: 'Ministerio de Salud (País Destino)',
          description: 'Autorización oficial de venta en el país de destino.',
          requirements: 'Trámite previo a la exportación obligatorio.'
        });
      }

      // Fertilizers (Chapter 31)
      if (chapter === '31') {
        commonDocs.push({
          name: 'Certificado de Análisis',
          issuer: 'Laboratorio Acreditado',
          description: 'Detalle de composición N-P-K y metales pesados.',
          requirements: 'Debe coincidir con las especificaciones de la etiqueta.'
        });
      }
    }

    // 4. SMART REGIONS & DB RULES
    const getRelevantRegions = (c: string | undefined) => {
      if (!c) return [];
      const cu = c.toUpperCase();
      const regions = [cu];
      if (euCountries.includes(cu)) regions.push('EU', 'EEA');
      if (['AR', 'BR', 'PY', 'UY', 'BO'].includes(cu)) regions.push('MERCOSUR');
      if (['US', 'USA', 'CA', 'CAN', 'MX', 'MEX'].includes(cu)) regions.push('USMCA');
      return regions;
    };

    const destRegions = getRelevantRegions(countryUpper);
    const originRegions = getRelevantRegions(originCountry);

    try {
      // Fetch rules from database
      const dbRules = await db.select().from(regulatoryRules).where(
        or(
          and(isNull(regulatoryRules.countryCode), isNull(regulatoryRules.originCountryCode), or(isNull(regulatoryRules.hsChapter), eq(regulatoryRules.hsChapter, chapter))),
          and(inArray(regulatoryRules.countryCode, destRegions), isNull(regulatoryRules.originCountryCode), or(isNull(regulatoryRules.hsChapter), eq(regulatoryRules.hsChapter, chapter))),
          and(isNull(regulatoryRules.countryCode), inArray(regulatoryRules.originCountryCode, originRegions), or(isNull(regulatoryRules.hsChapter), eq(regulatoryRules.hsChapter, chapter))),
          and(inArray(regulatoryRules.countryCode, destRegions), inArray(regulatoryRules.originCountryCode, originRegions), or(isNull(regulatoryRules.hsChapter), eq(regulatoryRules.hsChapter, chapter)))
        )
      );

      const mappedRules = dbRules.map(rule => ({
        name: rule.documentName,
        issuer: rule.issuer,
        description: rule.description,
        requirements: rule.requirements
      }));

      // 5. SANCTIONS (The High Alert Layer)
      const sanctionHits = await SanctionsService.checkSanctions(countryUpper, hsCode);
      const sanctions = sanctionHits.map(s => ({
        name: `⚠️ ALERTA DE SANCIÓN: ${s.authority}`,
        issuer: s.authority,
        description: s.message,
        requirements: `Sanción de nivel ${s.severity}. Riesgo legal alto en 2025.`,
        isSanction: true,
        severity: s.severity
      }));

      // 6. COMBINE EVERYTHING
      return [...sanctions, ...commonDocs, ...mappedRules];
    } catch (error) {
      console.error('Error fetching regulatory rules:', error);
      return commonDocs;
    }
  }
}
