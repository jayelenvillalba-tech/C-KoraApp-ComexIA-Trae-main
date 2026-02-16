import { db } from './backend/db-sqlite.js';
import { marketData, countryOpportunities, marketplacePosts } from './shared/schema-sqlite.js';
import { like, eq, and, sql } from 'drizzle-orm';

async function testRealData() {
  console.log('🔍 Testing Real Data Queries for Trigo (1001)...\n');

  try {
    // Test 1: Market Data (Top 3)
    console.log('📊 TOP 3 BUYERS (Market Data):');
    const macroData = await db.select({
      country: marketData.destinationCountry,
      totalVolume: sql`SUM(CAST(${marketData.volume} AS REAL))`,
      avgValue: sql`AVG(CAST(${marketData.valueUsd} AS REAL))`
    })
    .from(marketData)
    .where(like(marketData.hsCode, '1001%'))
    .groupBy(marketData.destinationCountry)
    .orderBy(sql`SUM(CAST(${marketData.volume} AS REAL)) DESC`)
    .limit(3);

    if (macroData.length > 0) {
      macroData.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.country}: ${(item.totalVolume / 1000000).toFixed(1)}M tons`);
      });
    } else {
      console.log('   ❌ NO DATA FOUND');
    }

    // Test 2: Treaties
    console.log('\n📜 TREATIES:');
    const treatyData = await db.select()
      .from(countryOpportunities)
      .where(and(
        like(countryOpportunities.hsCode, '1001%'),
        sql`${countryOpportunities.tradeAgreements} IS NOT NULL AND ${countryOpportunities.tradeAgreements} != '[]'`
      ))
      .orderBy(countryOpportunities.avgTariffRate)
      .limit(3);

    if (treatyData.length > 0) {
      treatyData.forEach((item, idx) => {
        const treaties = JSON.parse(item.tradeAgreements || '[]');
        console.log(`   ${idx + 1}. ${item.countryName}: ${treaties[0]} (${item.avgTariffRate}% tariff)`);
      });
    } else {
      console.log('   ❌ NO DATA FOUND');
    }

    // Test 3: Marketplace
    console.log('\n🔥 CHE.COMEX (Active Orders):');
    const marketplaceData = await db.select({
      country: marketplacePosts.originCountry,
      activeOrders: sql`COUNT(*)`,
      totalQuantity: sql`GROUP_CONCAT(${marketplacePosts.quantity})`
    })
    .from(marketplacePosts)
    .where(and(
      like(marketplacePosts.hsCode, '1001%'),
      eq(marketplacePosts.type, 'buy'),
      eq(marketplacePosts.status, 'active')
    ))
    .groupBy(marketplacePosts.originCountry)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(3);

    if (marketplaceData.length > 0) {
      marketplaceData.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.country}: ${item.activeOrders} active orders`);
      });
    } else {
      console.log('   ❌ NO DATA FOUND');
    }

    console.log('\n✅ Test completed!');
    console.log('\nIf you see "NO DATA FOUND" above, the seed script did not work.');
    console.log('If you see real data, the queries are working correctly!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testRealData()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
