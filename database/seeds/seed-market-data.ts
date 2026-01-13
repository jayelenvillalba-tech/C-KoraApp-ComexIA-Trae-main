
import { db } from '../db.js';
import { marketData } from '../../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';

const KEY_HS_CODES = [
  '0201', // Carne bovina fresca o refrigerada
  '0202', // Carne bovina congelada
  '1001', // Trigo
  '1201', // Soja
  '2709', // Petróleo crudo
  '2204'  // Vino
];

const TRADE_ROUTES = [
  { origin: 'AR', dest: 'CN', growth: 1.15, baseValue: 50 }, // Strong growth to China
  { origin: 'AR', dest: 'US', growth: 1.05, baseValue: 20 }, // Moderate growth to US
  { origin: 'AR', dest: 'BR', growth: 1.02, baseValue: 40 }, // Stable to Brazil
  { origin: 'AR', dest: 'DE', growth: 0.98, baseValue: 15 }, // Slight decline to Germany
  { origin: 'BR', dest: 'CN', growth: 1.12, baseValue: 100 },
  { origin: 'US', dest: 'CN', growth: 1.08, baseValue: 200 },
];

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024];

export async function seedMarketData() {
  console.log('🌱 Seeding Market Data (Historical 2018-2024)...');
  
  try {
    // Clear existing data? Maybe not, or we verify first.
    // For now, let's just insert.
    
    const records = [];

    for (const hsCode of KEY_HS_CODES) {
      for (const route of TRADE_ROUTES) {
        let currentValue = route.baseValue * 1_000_000; // Millions
        let currentVolume = currentValue * 0.5; // Approx price $2/kg for generic

        for (const year of YEARS) {
            // Add some randomness (+/- 10%)
            const noise = 0.9 + Math.random() * 0.2;
            
            // Adjust for specific years (e.g., 2020 COVID dip)
            let yearFactor = 1.0;
            if (year === 2020) yearFactor = 0.85; 

            // Calculate values
            const valueUsd = Math.round(currentValue * noise * yearFactor);
            const volume = Math.round(currentVolume * noise * yearFactor);
            
            // Calculate avg price
            const avgPriceUsd = parseFloat((valueUsd / volume).toFixed(2));

            records.push({
                hsCode,
                originCountry: route.origin,
                destinationCountry: route.dest,
                year,
                valueUsd,
                volume,
                avgPriceUsd,
                activeCompanies: Math.round(valueUsd / 500000) // Approx 500k per company avg
            });

            // Trend for next year
            currentValue = currentValue * route.growth;
            currentVolume = currentVolume * route.growth;
        }
      }
    }

    console.log(`📊 Generating ${records.length} historical records...`);
    
    // Batch insert
    await db.insert(marketData).values(records);
    
    console.log('✅ Market Data Seeded Successfully!');
  } catch (error) {
    console.error('❌ Error seeding market data:', error);
  }
}

// Execute if run directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    seedMarketData()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e);
            process.exit(1);
        });
}
