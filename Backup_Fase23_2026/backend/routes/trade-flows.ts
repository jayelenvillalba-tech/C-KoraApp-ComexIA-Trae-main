import { Request, Response } from 'express';
import { db } from '../../database/db-sqlite.js';
import { marketData } from '../../shared/schema-sqlite.js';
import { eq, and, sql } from 'drizzle-orm';

// Country coordinates (major trading partners)
const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  'AR': { lat: -34.6037, lng: -58.3816 }, // Buenos Aires
  'CN': { lat: 39.9042, lng: 116.4074 }, // Beijing
  'US': { lat: 38.9072, lng: -77.0369 }, // Washington DC
  'BR': { lat: -15.8267, lng: -47.9218 }, // Brasília
  'DE': { lat: 52.5200, lng: 13.4050 }, // Berlin
  'CL': { lat: -33.4489, lng: -70.6693 }, // Santiago
  'IN': { lat: 28.6139, lng: 77.2090 }, // New Delhi
  'JP': { lat: 35.6762, lng: 139.6503 }, // Tokyo
  'GB': { lat: 51.5074, lng: -0.1278 }, // London
  'FR': { lat: 48.8566, lng: 2.3522 }, // Paris
};

export async function getTradeFlows(req: Request, res: Response) {
  try {
    const { year = '2024', hsChapter, minValue = '0' } = req.query;

    // Build query conditions
    const conditions: any[] = [
      sql`${marketData.year} = ${parseInt(year as string)}`
    ];

    if (hsChapter) {
      conditions.push(sql`substr(${marketData.hsCode}, 1, 2) = ${hsChapter}`);
    }

    if (parseInt(minValue as string) > 0) {
      conditions.push(sql`${marketData.valueUsd} >= ${parseInt(minValue as string)}`);
    }

    // Fetch data
    const data = await db.select({
      hsCode: marketData.hsCode,
      origin: marketData.originCountry,
      destination: marketData.destinationCountry,
      valueUsd: marketData.valueUsd,
      volume: marketData.volume
    })
      .from(marketData)
      .where(and(...conditions))
      .limit(500); // Limit for performance

    // Transform to routes with coordinates
    const routes = data
      .filter((d: any) => COUNTRY_COORDS[d.origin] && COUNTRY_COORDS[d.destination])
      .map((d: any) => ({
        origin: {
          code: d.origin,
          ...COUNTRY_COORDS[d.origin]
        },
        destination: {
          code: d.destination,
          ...COUNTRY_COORDS[d.destination]
        },
        valueUsd: d.valueUsd,
        volume: d.volume,
        hsChapter: d.hsCode.substring(0, 2),
        productName: getProductName(d.hsCode.substring(0, 2))
      }));

    // Calculate heatmap (aggregate by destination country)
    const heatmap: Record<string, number> = {};
    data.forEach((d: any) => {
      if (!heatmap[d.destination]) heatmap[d.destination] = 0;
      heatmap[d.destination] += d.valueUsd || 0;
    });

    res.json({
      success: true,
      routes,
      heatmap,
      metadata: {
        year: parseInt(year as string),
        totalRoutes: routes.length,
        totalValue: routes.reduce((sum: number, r: any) => sum + (r.valueUsd || 0), 0)
      }
    });

  } catch (error: any) {
    console.error('Error fetching trade flows:', error);
    res.status(500).json({ error: error.message });
  }
}

function getProductName(chapter: string): string {
  const names: Record<string, string> = {
    '01': 'Live Animals',
    '02': 'Meat',
    '03': 'Fish',
    '10': 'Cereals',
    '12': 'Oil Seeds',
    '27': 'Mineral Fuels',
    '84': 'Machinery',
    '85': 'Electronics',
    '87': 'Vehicles'
  };
  return names[chapter] || 'Other Products';
}
