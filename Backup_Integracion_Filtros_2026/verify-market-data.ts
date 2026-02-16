import { db, initDatabase } from './database/db-sqlite.js';
import { marketData } from './shared/schema-sqlite.js';
import { sql } from 'drizzle-orm';

await initDatabase();

const count = await db.select({ count: sql`count(*)` }).from(marketData);
const sample = await db.select().from(marketData).limit(10);

console.log('\n📊 Market Data Verification:');
console.log(`   Total Records: ${count[0].count}`);
console.log('\n📦 Sample Records:');
sample.forEach((record, i) => {
  console.log(`   ${i + 1}. HS ${record.hsCode}: ${record.originCountry} → ${record.destinationCountry} (${record.year})`);
  console.log(`      Value: $${(record.valueUsd! / 1000000).toFixed(2)}M USD`);
});
