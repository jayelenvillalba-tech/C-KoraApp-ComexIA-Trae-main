import { initDatabase, saveDatabase, sqliteDb } from './db-sqlite';
import crypto from 'crypto';

console.log('=== SEED: REGULACIONES MENA & OCEANIA 2025 ===');

const MENA_OCEANIA_RULES = [
  // SAUDI ARABIA (GCC)
  {
    countryCode: 'SA',
    hsChapter: '84', // Maquinaria
    documentName: 'Certificado de Conformidad SABER',
    issuer: 'Saudi Standards, Metrology and Quality Organization (SASO)',
    description: 'Registro obligatorio en la plataforma SABER para productos regulados.',
    requirements: 'Registro de producto, Certificado de envío (Shipment CoC), Inspección de fábrica si aplica.'
  },
  {
    countryCode: 'SA',
    hsChapter: '85', // Electrónica
    documentName: 'Certificado de Seguridad SASO IECEE',
    issuer: 'SASO',
    description: 'Certificación de seguridad eléctrica obligatoria.',
    requirements: 'Reporte de prueba CB, Declaración de conformidad, Marcado G-Mark.'
  },
  // UAE (GCC)
  {
    countryCode: 'AE',
    hsChapter: null, // General
    documentName: 'Certificado de Valor Agrícola In-Country (ICV)',
    issuer: 'Ministry of Industry and Advanced Technology (MoIAT)',
    description: 'Certificado que acredita la contribución a la economía local.',
    requirements: 'Auditoría de estados financieros, Verificación por organismo certificado.',
    priority: 5
  },
  // ISRAEL
  {
    countryCode: 'IL',
    hsChapter: null,
    documentName: 'EU-Israel Harmony Certificate',
    issuer: 'SII (Standards Institution of Israel)',
    description: 'Certificado de cumplimiento con estándares europeos armonizados.',
    requirements: 'Pruebas de laboratorio, Marcado CE aceptado bajo condiciones específicas.'
  },
  // FIJI (Oceania)
  {
    countryCode: 'FJ',
    hsChapter: '02', // Carne
    documentName: 'Biosecurity Import Permit (BIP)',
    issuer: 'Biosecurity Authority of Fiji (BAF)',
    description: 'Permiso obligatorio para productos de origen animal.',
    requirements: 'Certificado de salud veterinaria del país de origen, Inspección en frontera.'
  },
  // PAPUA NEW GUINEA
  {
    countryCode: 'PG',
    hsChapter: '44', // Madera
    documentName: 'Timber Export License',
    issuer: 'PNG Forest Authority',
    description: 'Licencia para la exportación legal de productos madereros.',
    requirements: 'Certificado de legalidad de origen, Pago de tasas forestales.'
  }
];

async function main() {
  try {
    await initDatabase();
    console.log(`📊 Insertando ${MENA_OCEANIA_RULES.length} reglas para MENA y Oceanía...`);
    
    const insertStmt = sqliteDb.prepare(`
      INSERT OR REPLACE INTO regulatory_rules 
      (id, country_code, hs_chapter, origin_country_code, document_name, issuer, description, requirements, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let inserted = 0;
    for (const rule of MENA_OCEANIA_RULES) {
      const id = crypto.randomUUID();
      insertStmt.run(
        id,
        rule.countryCode,
        rule.hsChapter,
        null,
        rule.documentName,
        rule.issuer,
        rule.description,
        rule.requirements,
        rule.priority || 0
      );
      inserted++;
    }
    
    saveDatabase();
    console.log(`✅ ${inserted} reglas de MENA y Oceanía insertadas correctamente.`);
  } catch (error) {
    console.error('❌ Error en el seed:', error);
  }
}

main();
