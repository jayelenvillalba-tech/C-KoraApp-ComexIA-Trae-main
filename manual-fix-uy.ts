
import Database from 'better-sqlite3';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const db = new Database('comexia_v2.db');

console.log('📝 Insertando manual de documentos para Uruguay (Carne)...');

const docs = [
  "Certificado Sanitario Internacional", 
  "Permiso de Importación (MGAP)", 
  "Certificado de Origen", 
  "Factura Comercial", 
  "Packing List", 
  "Conocimiento de Embarque", 
  "Cadena de Frío -18°C"
];

const insert = db.prepare(`
  INSERT INTO regulatory_rules (
    id, country_code, hs_chapter, document_name, issuer, description, requirements, priority, created_at
  ) VALUES (
    @id, @countryCode, @hsChapter, @documentName, @issuer, @description, @requirements, @priority, @createdAt
  )
`);

let count = 0;
for (const doc of docs) {
  try {
    insert.run({
      id: uuid(),
      countryCode: 'UY',
      hsChapter: '02', // Carne
      documentName: doc,
      issuer: doc.includes('Sanitario') ? 'MGAP/SENASA' : 'Aduana',
      description: 'Requisito recuperado para carne bovina',
      requirements: doc,
      priority: 1,
      createdAt: Date.now()
    });
    count++;
  } catch (e: any) {
    console.log('Error:', e.message);
  }
}

console.log(`✅ Insertados ${count} documentos para Uruguay.`);
db.close();
