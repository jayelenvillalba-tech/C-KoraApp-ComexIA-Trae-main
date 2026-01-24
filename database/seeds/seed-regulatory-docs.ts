
import { initDatabase, saveDatabase, db } from '../db-sqlite.js';
import { regulatoryRules } from '../../shared/schema-sqlite.js';
import crypto from 'crypto';

console.log('=== SEED: DOCUMENTACIÓN REGLAMENTARIA (Debug Mode) ===');

const REGULATORY_DOCS = [
  {
    countryCode: 'CN',
    hsCode: '1201',
    requiredDocuments: JSON.stringify([
      { name: 'Certificado Fitosanitario', issuer: 'SENASA', description: 'Plagas', requirements: 'Inspección' },
      { name: 'Certificado de Origen', issuer: 'Cámara Comercio', description: 'Origen', requirements: 'Factura' }
    ])
  },
  {
    countryCode: 'CN',
    hsCode: '1001', // Trigo
    requiredDocuments: JSON.stringify([
      { name: 'Certificado Fitosanitario (Protocolo Trigo)', issuer: 'SENASA', description: 'Libre de Tilletia indica', requirements: 'Inspección previa embarque' },
      { name: 'Certificado de Calidad', issuer: 'Senasa/Privado', description: 'Proteína y Humedad', requirements: 'Análisis Lab' },
      { name: 'Licencia de Importación (China)', issuer: 'MOFCOM', description: 'Quota Importación', requirements: 'Comprador debe poseerla' }
    ])
  },
  {
    countryCode: 'BR',
    hsCode: '1001',
    requiredDocuments: JSON.stringify([
      { name: 'Certificado Fitosanitario', issuer: 'SENASA', description: 'Plagas', requirements: 'Inspección' },
      { name: 'Certificado de Origen MERCOSUR', issuer: 'Cámara Comercio', description: 'Mercosur', requirements: 'Formulario' }
    ])
  }
];

async function main() {
  try {
    await initDatabase();
    
    console.log('✅ Connected to database');
    
    let inserted = 0;
    for (const doc of REGULATORY_DOCS) {
      const requiredDocs = JSON.parse(doc.requiredDocuments);
      const hsChapter = doc.hsCode.substring(0, 2);

      for (const rDoc of requiredDocs) {
        try {
          await db.insert(regulatoryRules).values({
            id: crypto.randomUUID(),
            countryCode: doc.countryCode,
            hsChapter: hsChapter,
            documentName: rDoc.name,
            issuer: rDoc.issuer,
            description: rDoc.description,
            requirements: rDoc.requirements,
          });
          console.log(`✓ Inserted: ${rDoc.name} for ${doc.countryCode}`);
          inserted++;
        } catch (error: any) {
          console.error(`❌ Error inserting ${rDoc.name}:`, error.message);
        }
      }
    }
    
    saveDatabase();
    console.log(`✅ Total inserted: ${inserted}`);
    
  } catch (error: any) {
    console.error('❌ FATAL Error:', error.message);
    process.exit(1);
  }
}

main();
