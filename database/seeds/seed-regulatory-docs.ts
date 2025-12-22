
import { initDatabase, saveDatabase, getSqliteDb } from '../db-sqlite.js';
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
    const sqliteDb = getSqliteDb();
    if (!sqliteDb) throw new Error("DB handle is null");
    
    console.log('✅ Connected to database');
    
    let inserted = 0;
    for (const doc of REGULATORY_DOCS) {
      const requiredDocs = JSON.parse(doc.requiredDocuments);
      const hsChapter = doc.hsCode.substring(0, 2);

      for (const rDoc of requiredDocs) {
        try {
          const id = crypto.randomUUID();
          sqliteDb.run(
            'INSERT INTO regulatory_rules (id, country_code, hs_chapter, document_name, issuer, description, requirements, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, doc.countryCode, hsChapter, rDoc.name, rDoc.issuer, rDoc.description, rDoc.requirements, Date.now()]
          );
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
