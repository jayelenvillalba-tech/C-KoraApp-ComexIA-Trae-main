
import { db, initDatabase } from './db-sqlite.js';
import * as schema from '../shared/schema-sqlite.js';
import { sql } from 'drizzle-orm';

async function verify() {
  console.log('🔍 Verifying ComexIA Data...');
  await initDatabase();
  
  const tables = [
    { name: 'HS Subpartidas', table: schema.hsSubpartidas },
    { name: 'HS Partidas', table: schema.hsPartidas },
    { name: 'HS Chapters', table: schema.hsChapters },
    { name: 'HS Sections', table: schema.hsSections },
    { name: 'Companies', table: schema.companies },
    { name: 'Marketplace Posts', table: schema.marketplacePosts },
    { name: 'Users', table: schema.users },
    { name: 'Regulatory Rules', table: schema.regulatoryRules },
    { name: 'Sanctions', table: schema.sanctionsList }
  ];

  for (const t of tables) {
    try {
      const result = await db.select({ count: sql`count(*)` }).from(t.table);
      console.log(`✅ ${t.name}: ${result[0].count} records`);
    } catch (e: any) {
      console.log(`❌ ${t.name}: Error - ${e.message}`);
    }
  }

  process.exit(0);
}

verify();
