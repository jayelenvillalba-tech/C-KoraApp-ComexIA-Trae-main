import { db } from './database/db.js';
import { hsSubpartidas } from './shared/schema-sqlite.js';
import { like, sql } from 'drizzle-orm';

async function testSearch() {
  try {
    console.log('Testing search for "trigo"...');
    const results = await db.select()
      .from(hsSubpartidas)
      .where(like(sql`lower(${hsSubpartidas.description})`, '%trigo%'))
      .limit(5);
    
    console.log(`Found ${results.length} results:`);
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

testSearch();
