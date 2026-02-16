
import { Request, Response } from 'express';
import { db, getSqliteDb } from '../../database/db-sqlite';
import { marketplacePosts } from '../../shared/schema-sqlite';
import { OpportunityEngineService } from '../services/opportunity-engine';

// Helper functions (could be moved to shared utils)
function getCountryCode(countryName: string | null): string {
    if (!countryName) return 'XX';
    const map: Record<string, string> = {
        'China': 'CN', 'India': 'IN', 'Estados Unidos': 'US', 'Brasil': 'BR', 'Alemania': 'DE',
        'Reino Unido': 'GB', 'Francia': 'FR', 'Italia': 'IT', 'Rusia': 'RU', 'Japón': 'JP',
        'Corea del Sur': 'KR', 'Chile': 'CL', 'Argentina': 'AR', 'México': 'MX', 'España': 'ES',
        'Australia': 'AU', 'Canadá': 'CA', 'Egipto': 'EG', 'Países Bajos': 'NL', 'Vietnam': 'VN',
        'Indonesia': 'ID', 'Argelia': 'DZ', 'Arabia Saudita': 'SA', 'Turquía': 'TR'
    };
    return map[countryName] || 'XX';
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

export async function handleCountryRecommendations(req: Request, res: Response) {
  try {
    const { hsCode, product, originCountry } = req.query;
    
    // 🧠 AI-Driven Opportunity Engine
    // Puede recibir hsCode directo O producto ("Vino")
    const input = (hsCode as string) || (product as string);
    const origin = (originCountry as string) || 'Argentina';

    if (!input) {
      return res.status(400).json({ error: 'HsCode or Product name is required' });
    }

    console.log(`[OPPORTUNITY ENGINE] Analyzing for "${input}" from ${origin}`);

    // 🚀 Llama al motor central
    const rankedOpportunities = await OpportunityEngineService.analyzeOpportunity(input, origin);

    // Transformamos para mantener compatibilidad con frontend actual (MVP)
    // El frontend espera: topBuyers, treatyRecommendations, marketplaceData
    
    // Top Buyers = Los mejores rankeados por el Engine
    const topBuyers = rankedOpportunities.slice(0, 3).map(op => ({
        rank: op.rank,
        country: op.country,
        countryCode: op.countryCode,
        volume: op.marketData.volume,
        avgValue: op.marketData.value / op.marketData.volume, // Price
        details: op.details, // Nuevo: Mostramos score breakdown para quien lo consuma
        coordinates: getCountryCoordinates(op.countryCode)
    }));

    // Treaty Recs = Los mismos, pero con énfasis en la info regulatoria
    const treatyRecommendations = rankedOpportunities.slice(0, 3).map(op => {
         const rule = op.regulations.tariff.agreement || 'WTO/MFN';
         return {
            rank: op.rank,
            country: op.country,
            countryCode: op.countryCode,
            treaty: rule,
            tariff: op.regulations.tariff.rate,
            coordinates: getCountryCoordinates(op.countryCode),
            regulations: op.regulations // Rich data passthrough
         };
    });

    // 3. CHE.COMEX - MARKETPLACE DEMAND (Restored & Fixed via Raw SQL)
    // Using raw SQL to avoid Drizzle/SQLite driver compatibility issues with LIKE/Count
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
            marketplaceData = stmt.all(`${input}%`, `%${input}%`);
        } catch (e) {
            console.error('Error fetching marketplace data:', e);
            marketplaceData = [];
        }
    }

    const cheComexRecommended = marketplaceData.map((item, idx) => ({
      rank: idx + 1,
      country: item.country,
      countryCode: getCountryCode(item.country),
      activeOrders: item.activeOrders,
      coordinates: getCountryCoordinates(getCountryCode(item.country))
    })); 

    res.json({
        topBuyers,
        treatyRecommendations,
        cheComexRecommended, // Renamed for clarity in frontend
        aiAnalysis: {
            detectedProduct: input, 
            scoreModel: "(Demand * 0.4) + (Tariff * 0.3) + (Ease * 0.3)"
        }
    });

  } catch (error: any) {
    console.error('[ERROR] Opportunity Engine:', error);
    res.status(500).json({ error: error.message });
  }
}
