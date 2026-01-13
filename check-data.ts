import { db } from './database/db-sqlite.js';
import { marketData } from './shared/schema-sqlite.js';
import { sql } from 'drizzle-orm';

async function checkData() {
  console.log('Checking market data for HS code 8435...');
  
  // Check exact match
  const exact = await db.select()
    .from(marketData)
    .where(sql`${marketData.hsCode} = '8435'`)
    .limit(5);
  console.log('Exact match (8435):', exact.length, 'records');
  
  // Check LIKE match
  const like = await db.select()
    .from(marketData)
    .where(sql`${marketData.hsCode} LIKE '8435%'`)
    .limit(5);
  console.log('LIKE match (8435%):', like.length, 'records');
  if (like.length > 0) {
    console.log('Sample:', like[0]);
  }
  
  // Check chapter 84
  const chapter = await db.select()
    .from(marketData)
    .where(sql`substr(${marketData.hsCode}, 1, 2) = '84'`)
    .limit(5);
  console.log('Chapter 84:', chapter.length, 'records');
  if (chapter.length > 0) {
    console.log('Sample:', chapter[0]);
  }
  
  // Check origin AR
  const arOrigin = await db.select()
    .from(marketData)
    .where(sql`${marketData.originCountry} = 'AR'`)
    .limit(5);
  console.log('Origin AR:', arOrigin.length, 'records');
  if (arOrigin.length > 0) {
    console.log('Sample:', arOrigin[0]);
  }
  
  // Total records
  const total = await db.select({ count: sql`count(*)` })
    .from(marketData);
  console.log('Total market data records:', total[0]);
  
  process.exit(0);
}

checkData().catch(console.error);
