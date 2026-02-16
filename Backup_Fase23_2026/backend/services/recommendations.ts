import { db } from '../db-sqlite';
import { marketData, countryOpportunities, marketplacePosts } from '../../shared/schema-sqlite';
import { eq, and, desc, like, sql } from 'drizzle-orm';

// Helper functions
function getCountryCode(countryName: string | null): string {
    if (!countryName) return 'XX';
    const map: Record<string, string> = {
        'China': 'CN', 'India': 'IN', 'Estados Unidos': 'US', 'Brasil': 'BR', 'Alemania': 'DE',
        'Reino Unido': 'GB', 'Francia': 'FR', 'Italia': 'IT', 'Rusia': 'RU', 'Japón': 'JP',
        'Corea del Sur': 'KR', 'Chile': 'CL', 'Argentina': 'AR', 'México': 'MX', 'España': 'ES',
        'Australia': 'AU', 'Canadá': 'CA', 'Egipto': 'EG', 'Países Bajos': 'NL', 'Vietnam': 'VN',
        'Indonesia': 'ID', 'Argelia': 'DZ', 'Arabia Saudita': 'SA', 'Turquía': 'TR'
    };
    return map[countryName] || Object.values(map).includes(countryName) ? countryName : 'XX';
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

export async function getCountryRecommendations(hsCode: string, originCountry?: string) {
  console.log(`[RECOMMENDATIONS] Fetching for HS Code: ${hsCode}`);

  // ---------------------------------------------------------
  // STREAM 1: TOP 3 BUYERS - REAL MACRO DATA from market_data table
  // ---------------------------------------------------------
  const macroData = await db.select({
    country: marketData.destinationCountry,
    totalVolume: sql<number>`SUM(CAST(${marketData.volume} AS REAL))`,
    avgValue: sql<number>`AVG(CAST(${marketData.valueUsd} AS REAL))`
  })
  .from(marketData)
  .where(like(marketData.hsCode, `${hsCode}%`))
  .groupBy(marketData.destinationCountry)
  .orderBy(desc(sql`SUM(CAST(${marketData.volume} AS REAL))`))
  .limit(3);

  console.log(`[TOP 3] Found ${macroData.length} countries with real import data`);

  const topBuyers = macroData.map((item, idx) => ({
    rank: idx + 1,
    country: item.country,
    countryCode: getCountryCode(item.country),
    volume: Math.round(item.totalVolume || 0),
    avgValue: Math.round(item.avgValue || 0),
    coordinates: getCountryCoordinates(getCountryCode(item.country))
  }));

  // ---------------------------------------------------------
  // STREAM 2: TREATY RECOMMENDATIONS - ONLY REAL TREATIES
  // ---------------------------------------------------------
  const treatyData = await db.select()
    .from(countryOpportunities)
    .where(and(
      like(countryOpportunities.hsCode, `${hsCode}%`),
      sql`${countryOpportunities.tradeAgreements} IS NOT NULL AND ${countryOpportunities.tradeAgreements} != '[]'`
    ))
    .orderBy(countryOpportunities.avgTariffRate)
    .limit(3);

  console.log(`[TREATIES] Found ${treatyData.length} countries with trade agreements`);

  const treatyRecommendations = treatyData.map((item, idx) => ({
    rank: idx + 1,
    country: item.countryName,
    countryCode: item.countryCode,
    treaty: JSON.parse(item.tradeAgreements || '[]')[0] || 'Acuerdo Comercial',
    tariff: item.avgTariffRate,
    coordinates: getCountryCoordinates(item.countryCode)
  }));

  // ---------------------------------------------------------
  // STREAM 3: CHE.COMEX - ACTIVE MARKETPLACE DEMAND
  // ---------------------------------------------------------
  const marketplaceData = await db.select({
    country: marketplacePosts.originCountry,
    activeOrders: sql<number>`COUNT(*)`,
    totalQuantity: sql<string>`GROUP_CONCAT(${marketplacePosts.quantity})`
  })
  .from(marketplacePosts)
  .where(and(
    like(marketplacePosts.hsCode, `${hsCode}%`),
    eq(marketplacePosts.type, 'buy'),
    eq(marketplacePosts.status, 'active')
  ))
  .groupBy(marketplacePosts.originCountry)
  .orderBy(desc(sql`COUNT(*)`))
  .limit(3);

  console.log(`[CHE.COMEX] Found ${marketplaceData.length} countries with active buy orders`);

  const cheComexRecommended = marketplaceData.map((item, idx) => ({
    rank: idx + 1,
    country: item.country,
    countryCode: getCountryCode(item.country),
    activeOrders: item.activeOrders,
    totalQuantity: item.totalQuantity,
    coordinates: getCountryCoordinates(getCountryCode(item.country))
  }));

  return {
    topBuyers,              // REAL MACRO DATA
    treatyRecommendations,  // REAL TREATIES ONLY
    cheComexRecommended     // REAL MARKETPLACE DEMAND
  };
}
