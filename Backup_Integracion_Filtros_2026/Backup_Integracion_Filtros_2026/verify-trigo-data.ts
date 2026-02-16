import { db } from './backend/db-sqlite';
import { marketData, countryOpportunities, marketplacePosts } from './shared/schema-sqlite';
import { like, eq, and } from 'drizzle-orm';

async function verify() {
  console.log('🔍 Verifying Trigo data...\n');

  // Check market data
  const market = await db.select().from(marketData).where(like(marketData.hsCode, '1001%'));
  console.log(`📊 Market Data: ${market.length} records`);
  market.forEach(d => console.log(`   ${d.destinationCountry}: ${d.volume} tons`));

  // Check treaties
  const treaties = await db.select().from(countryOpportunities).where(like(countryOpportunities.hsCode, '1001%'));
  console.log(`\n📜 Treaties: ${treaties.length} records`);
  treaties.forEach(t => console.log(`   ${t.countryName}: ${t.tradeAgreements}`));

  // Check marketplace
  const posts = await db.select().from(marketplacePosts).where(and(
    like(marketplacePosts.hsCode, '1001%'),
    eq(marketplacePosts.type, 'buy'),
    eq(marketplacePosts.status, 'active')
  ));
  console.log(`\n🔥 Active Buy Orders: ${posts.length} records`);
  posts.forEach(p => console.log(`   ${p.originCountry}: ${p.quantity}`));
}

verify().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
