
import { initDatabase } from '../database/db-sqlite';
import { OpportunityEngineService } from '../backend/services/opportunity-engine';
import { db } from '../database/db-sqlite';
import { marketplacePosts } from '../shared/schema-sqlite';
import { sql, like, or, eq, desc, and } from 'drizzle-orm';

// Mock helper functions from route
function getCountryCode(countryName: string | null): string {
    if (!countryName) return 'XX';
    const map: Record<string, string> = {
        'China': 'CN', 'Estados Unidos': 'US', 'Brasil': 'BR', 'Alemania': 'DE','Chile':'CL', 'Argentina': 'AR'
    };
    return map[countryName] || 'XX';
}

function getCountryCoordinates(countryCode: string): [number, number] {
    return [0, 0]; // Dummy for test
}

async function debugApi() {
    console.log('🐞 Debugging API Response Logic...');
    await initDatabase();

    const input = 'Vino';
    const origin = 'Argentina';

    // 1. Opportunity Engine
    const rankedOpportunities = await OpportunityEngineService.analyzeOpportunity(input, origin);
    
    const topBuyers = rankedOpportunities.slice(0, 3).map(op => ({
        rank: op.rank,
        country: op.country,
        details: op.details // <--- CRITICAL CHECK
    }));

    console.log('\n--- TOP BUYERS (Check for details) ---');
    console.log(JSON.stringify(topBuyers, null, 2));

    // 2. Marketplace Logic (Restored)
    const marketplaceData = await db.select({
      country: marketplacePosts.originCountry,
      activeOrders: sql<number>`COUNT(*)`
    })
    .from(marketplacePosts)
    .where(and(
      or(
          like(marketplacePosts.hsCode, `${input}%`),
          like(marketplacePosts.productName, `%${input}%`)
      ),
      eq(marketplacePosts.type, 'buy'),
      eq(marketplacePosts.status, 'active')
    ))
    .groupBy(marketplacePosts.originCountry)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(3);

    console.log('\n--- MARKETPLACE DATA (Check for restore) ---');
    console.log(JSON.stringify(marketplaceData, null, 2));
}

debugApi().catch(console.error);
