import { initDatabase, sqliteDb, saveDatabase } from '../db-sqlite.js';
import crypto from 'crypto';

async function main() {
  await initDatabase();
  
  const companiesResult = sqliteDb.exec('SELECT id, name FROM companies LIMIT 20');
  const companies = companiesResult[0]?.values || [];
  
  for (let i = 0; i < 20; i++) {
    const entityType = i % 2 === 0 ? 'company' : 'employee';
    const entityId = i % 2 === 0 ? companies[i % companies.length]?.[0] : crypto.randomUUID();
    const entityName = i % 2 === 0 ? companies[i % companies.length]?.[1] : `Employee ${i}`;
    
    try {
      sqliteDb.run(
        `INSERT INTO verifications (id, entity_type, entity_id, entity_name, verification_type, status, documents, notes, submitted_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          entityType,
          entityId,
          entityName,
          'identity',
          'pending',
          JSON.stringify(['/uploads/doc1.pdf', '/uploads/doc2.pdf']),
          `Verification ${i + 1} pending admin review`,
          new Date(Date.now() - i * 6 * 60 * 60 * 1000).toISOString()
        ]
      );
    } catch(e: any) {
      console.error(`Error ${i}:`, e.message);
    }
  }
  
  saveDatabase();
  const total = sqliteDb.exec('SELECT COUNT(*) FROM verifications')[0]?.values[0][0];
  console.log(`✅ ${total} verifications seeded`);
}

main();
