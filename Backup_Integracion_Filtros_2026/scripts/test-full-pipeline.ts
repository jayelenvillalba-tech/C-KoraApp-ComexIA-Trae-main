
import { initDatabase } from '../database/db-sqlite';
import { OpportunityEngineService } from '../backend/services/opportunity-engine';
import { getSqliteDb } from '../database/db-sqlite';

async function testFullPipeline() {
    console.log('🧪 COMPREHENSIVE OPPORTUNITY ENGINE TEST\n');
    console.log('=' .repeat(60));
    
    await initDatabase();
    
    // Test multiple products
    const testCases = [
        { product: 'Vino', origin: 'Argentina' },
        { product: 'Habas de soja', origin: 'Argentina' },
        { product: 'Litio', origin: 'Argentina' }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n\n📦 Testing: "${testCase.product}" from ${testCase.origin}`);
        console.log('-'.repeat(60));
        
        try {
            // 1. Opportunity Engine Analysis
            const opportunities = await OpportunityEngineService.analyzeOpportunity(
                testCase.product, 
                testCase.origin
            );
            
            console.log(`\n✅ OpportunityEngine returned ${opportunities.length} ranked markets`);
            
            // 2. Transform to API Response Format (simulating backend/routes/country-recommendations.ts)
            const topBuyers = opportunities.slice(0, 3).map(op => ({
                rank: op.rank,
                country: op.country,
                countryCode: op.countryCode,
                volume: op.marketData.volume,
                avgValue: op.marketData.value / op.marketData.volume,
                details: op.details,
                coordinates: getCountryCoordinates(op.countryCode)
            }));
            
            const treatyRecommendations = opportunities.slice(0, 3).map(op => {
                const rule = op.regulations.tariff.agreement || 'WTO/MFN';
                return {
                    rank: op.rank,
                    country: op.country,
                    countryCode: op.countryCode,
                    treaty: rule,
                    tariff: op.regulations.tariff.rate,
                    coordinates: getCountryCoordinates(op.countryCode),
                    regulations: op.regulations
                };
            });
            
            // 3. Marketplace Data
            const dbRaw = getSqliteDb();
            let marketplaceData: any[] = [];
            
            if (dbRaw) {
                try {
                    const stmt = dbRaw.prepare(`
                        SELECT 
                            origin_country as country, 
                            COUNT(*) as activeOrders
                        FROM marketplace_posts 
                        WHERE (hs_code LIKE ? OR product_name LIKE ?)
                        AND type = 'buy' 
                        AND status = 'active'
                        GROUP BY origin_country 
                        ORDER BY activeOrders DESC 
                        LIMIT 3
                    `);
                    const hsCode = opportunities[0]?.marketData ? String(opportunities[0].marketData).substring(0, 4) : testCase.product;
                    marketplaceData = stmt.all(`${hsCode}%`, `%${testCase.product}%`);
                } catch (e) {
                    console.warn('⚠️  Marketplace query failed:', e);
                }
            }
            
            const cheComexRecommended = marketplaceData.map((item, idx) => ({
                rank: idx + 1,
                country: item.country,
                activeOrders: item.activeOrders
            }));
            
            // 4. Display Results
            console.log(`\n📊 API Response Summary:`);
            console.log(`   - Top Buyers: ${topBuyers.length}`);
            console.log(`   - Treaty Recommendations: ${treatyRecommendations.length}`);
            console.log(`   - Marketplace Opportunities: ${cheComexRecommended.length}`);
            
            console.log(`\n🗺️  Map Data Check:`);
            topBuyers.forEach(b => {
                const hasCoords = b.coordinates && b.coordinates[0] !== 0;
                console.log(`   ${hasCoords ? '✅' : '❌'} ${b.country} (${b.countryCode}): coords=${JSON.stringify(b.coordinates)}`);
            });
            
            console.log(`\n📜 Treaty Data Check:`);
            treatyRecommendations.forEach(t => {
                const hasCoords = t.coordinates && t.coordinates[0] !== 0;
                console.log(`   ${hasCoords ? '✅' : '❌'} ${t.country}: ${t.treaty} (${t.tariff}% tariff)`);
            });
            
            if (cheComexRecommended.length > 0) {
                console.log(`\n⭐ Marketplace Data:`);
                cheComexRecommended.forEach(m => {
                    console.log(`   ✅ ${m.country}: ${m.activeOrders} active orders`);
                });
            } else {
                console.log(`\n⚠️  No marketplace data found for "${testCase.product}"`);
            }
            
        } catch (error: any) {
            console.error(`\n❌ Test FAILED for "${testCase.product}":`, error.message);
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test Suite Complete\n');
}

function getCountryCoordinates(countryCode: string): [number, number] {
    const coords: Record<string, [number, number]> = {
        'CN': [35.8617, 104.1954], 'IN': [20.5937, 78.9629], 'US': [37.0902, -95.7129],
        'BR': [-14.2350, -51.9253], 'DE': [51.1657, 10.4515], 'GB': [55.3781, -3.4360],
        'FR': [46.2276, 2.2137], 'IT': [41.8719, 12.5674], 'RU': [61.5240, 105.3188],
        'JP': [36.2048, 138.2529], 'KR': [35.9078, 127.7669], 'CL': [-35.6751, -71.5430],
        'AR': [-38.4161, -63.6167], 'MX': [23.6345, -102.5528], 'ES': [40.4637, -3.7492],
        'AU': [-25.2744, 133.7751], 'CA': [56.1304, -106.3468], 'EG': [26.8206, 30.8025],
        'NL': [52.1326, 5.2913], 'VN': [14.0583, 108.2772], 'ID': [-0.7893, 113.9213],
        'DZ': [28.0339, 1.6596], 'SA': [23.8859, 45.0792], 'TR': [38.9637, 35.2433]
    };
    return coords[countryCode] || [0, 0];
}

testFullPipeline().catch(console.error);
