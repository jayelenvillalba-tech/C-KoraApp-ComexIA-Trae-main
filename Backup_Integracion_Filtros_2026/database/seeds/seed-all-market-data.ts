import { db } from '../db-sqlite.js';
import { marketData, hsSubpartidas } from '../../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';

// Chapter-based value multipliers (based on real trade patterns)
const CHAPTER_MULTIPLIERS: Record<string, number> = {
  '01': 0.8,  // Live animals
  '02': 1.2,  // Meat
  '03': 0.9,  // Fish
  '04': 0.7,  // Dairy
  '05': 0.5,  // Animal products
  '06': 0.3,  // Live trees
  '07': 0.6,  // Vegetables
  '08': 0.7,  // Fruits
  '09': 1.0,  // Coffee, tea, spices
  '10': 1.5,  // Cereals
  '11': 0.4,  // Milling products
  '12': 1.3,  // Oil seeds
  '13': 0.3,  // Lac, gums
  '14': 0.2,  // Vegetable plaiting
  '15': 1.1,  // Animal/vegetable fats
  '16': 0.6,  // Meat preparations
  '17': 0.8,  // Sugars
  '18': 0.7,  // Cocoa
  '19': 0.5,  // Cereal preparations
  '20': 0.6,  // Vegetable preparations
  '21': 0.5,  // Miscellaneous edible
  '22': 1.0,  // Beverages
  '23': 0.7,  // Food residues
  '24': 0.9,  // Tobacco
  '25': 1.2,  // Salt, sulfur
  '26': 0.8,  // Ores
  '27': 3.5,  // Mineral fuels (OIL!)
  '28': 1.0,  // Inorganic chemicals
  '29': 1.5,  // Organic chemicals
  '30': 2.0,  // Pharmaceutical
  '31': 0.9,  // Fertilizers
  '32': 0.8,  // Tanning/dyeing
  '33': 1.1,  // Essential oils
  '34': 0.6,  // Soap, waxes
  '35': 0.7,  // Albuminoidal
  '36': 0.5,  // Explosives
  '37': 0.6,  // Photo/cinema
  '38': 0.9,  // Miscellaneous chemical
  '39': 1.8,  // Plastics
  '40': 1.2,  // Rubber
  '41': 0.7,  // Raw hides
  '42': 0.8,  // Leather articles
  '43': 0.4,  // Furskins
  '44': 1.0,  // Wood
  '45': 0.3,  // Cork
  '46': 0.2,  // Basketwork
  '47': 0.6,  // Pulp
  '48': 0.9,  // Paper
  '49': 0.5,  // Printed books
  '50': 0.4,  // Silk
  '51': 0.6,  // Wool
  '52': 0.7,  // Cotton
  '53': 0.4,  // Vegetable textile
  '54': 0.8,  // Man-made filaments
  '55': 0.7,  // Man-made staple
  '56': 0.5,  // Wadding, felt
  '57': 0.6,  // Carpets
  '58': 0.5,  // Special woven
  '59': 0.6,  // Impregnated textiles
  '60': 0.5,  // Knitted fabrics
  '61': 1.0,  // Knitted apparel
  '62': 1.1,  // Woven apparel
  '63': 0.6,  // Textile articles
  '64': 1.0,  // Footwear
  '65': 0.3,  // Headgear
  '66': 0.2,  // Umbrellas
  '67': 0.3,  // Feathers
  '68': 0.7,  // Stone/cement
  '69': 0.6,  // Ceramic
  '70': 0.8,  // Glass
  '71': 2.5,  // Precious stones (JEWELRY!)
  '72': 1.5,  // Iron/steel
  '73': 1.0,  // Iron/steel articles
  '74': 1.2,  // Copper
  '75': 0.8,  // Nickel
  '76': 1.0,  // Aluminum
  '78': 0.6,  // Lead
  '79': 0.7,  // Zinc
  '80': 0.5,  // Tin
  '81': 0.9,  // Other base metals
  '82': 0.7,  // Tools
  '83': 0.6,  // Miscellaneous metal
  '84': 3.0,  // Machinery (HIGH VALUE!)
  '85': 3.5,  // Electrical machinery (HIGHEST!)
  '86': 1.5,  // Railway
  '87': 2.8,  // Vehicles (CARS!)
  '88': 2.0,  // Aircraft
  '89': 1.3,  // Ships
  '90': 2.2,  // Optical/medical
  '91': 1.5,  // Clocks/watches
  '92': 0.8,  // Musical instruments
  '93': 0.9,  // Arms/ammunition
  '94': 1.0,  // Furniture
  '95': 0.9,  // Toys/games
  '96': 0.6,  // Miscellaneous
  '97': 1.8,  // Art/antiques
};

// Trade routes with realistic growth patterns
const TRADE_ROUTES = [
  { origin: 'AR', dest: 'CN', gdpFactor: 2.5, growth: 1.15, distance: 19000 },  // China (huge market)
  { origin: 'AR', dest: 'US', gdpFactor: 3.0, growth: 1.05, distance: 8500 },   // USA (mature)
  { origin: 'AR', dest: 'BR', gdpFactor: 1.8, growth: 1.02, distance: 1200 },   // Brazil (regional)
  { origin: 'AR', dest: 'DE', gdpFactor: 2.2, growth: 0.98, distance: 11500 },  // Germany (declining)
  { origin: 'AR', dest: 'CL', gdpFactor: 1.0, growth: 1.03, distance: 1400 },   // Chile (stable)
  { origin: 'AR', dest: 'IN', gdpFactor: 1.5, growth: 1.12, distance: 13500 },  // India (growing)
];

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024];
const BASE_VALUE_PER_ROUTE = 10; // Million USD base

export async function seedAllMarketData() {
  console.log('🌍 Seeding Complete Market Data for 2500 HS Codes...');
  console.log('⏱️  Estimated time: ~2-3 minutes\n');

  try {
    // Initialize database first
    const { initDatabase } = await import('../db-sqlite.js');
    await initDatabase();
    console.log('✅ Database initialized\n');

    // Get all HS codes
    const allHsCodes = await db.select({ code: hsSubpartidas.code })
      .from(hsSubpartidas)
      .where(eq(hsSubpartidas.isActive, true));

    console.log(`📊 Found ${allHsCodes.length} active HS codes`);

    const records = [];
    let processedCount = 0;

    for (const { code: hsCode } of allHsCodes) {
      const chapter = hsCode.substring(0, 2);
      const chapterMultiplier = CHAPTER_MULTIPLIERS[chapter] || 0.5;

      for (const route of TRADE_ROUTES) {
        // Calculate base value for this product-route combination
        let baseValue = BASE_VALUE_PER_ROUTE * chapterMultiplier * route.gdpFactor;
        
        // Distance penalty (farther = slightly more expensive, less volume)
        const distanceFactor = 1 - (route.distance / 30000) * 0.2; // Max 20% reduction
        baseValue *= distanceFactor;

        // Convert to actual USD
        let currentValue = baseValue * 1_000_000;
        let currentVolume = currentValue * 0.4; // Avg $2.5/kg

        for (const year of YEARS) {
          // Year-specific adjustments
          let yearFactor = 1.0;
          if (year === 2020) yearFactor = 0.82; // COVID-19 impact
          if (year === 2021) yearFactor = 1.08; // Recovery bounce

          // Random variation (±15% for realism)
          const noise = 0.85 + Math.random() * 0.3;

          // Calculate final values
          const valueUsd = Math.round(currentValue * noise * yearFactor);
          const volume = Math.round(currentVolume * noise * yearFactor);
          const avgPriceUsd = volume > 0 ? parseFloat((valueUsd / volume).toFixed(2)) : 0;

          records.push({
            hsCode,
            originCountry: route.origin,
            destinationCountry: route.dest,
            year,
            valueUsd,
            volume,
            avgPriceUsd,
            activeCompanies: Math.max(1, Math.round(valueUsd / 800000))
          });

          // Apply growth for next year
          currentValue *= route.growth;
          currentVolume *= route.growth;
        }
      }

      processedCount++;
      if (processedCount % 250 === 0) {
        console.log(`   ✓ Processed ${processedCount}/${allHsCodes.length} HS codes...`);
      }
    }

    console.log(`\n📦 Generated ${records.length.toLocaleString()} historical records`);
    console.log('💾 Inserting into database...');

    // Batch insert (SQLite can handle large inserts)
    const BATCH_SIZE = 1000;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      await db.insert(marketData).values(batch);
      
      const progress = Math.round((i / records.length) * 100);
      process.stdout.write(`\r   Progress: ${progress}% (${i.toLocaleString()}/${records.length.toLocaleString()})`);
    }

    console.log('\n\n✅ Market Data Seeded Successfully!');
    console.log(`📊 Total Records: ${records.length.toLocaleString()}`);
    console.log(`🌐 Coverage: ${allHsCodes.length} products × ${TRADE_ROUTES.length} routes × ${YEARS.length} years`);

    // Save database to disk
    const { saveDatabase } = await import('../db-sqlite.js');
    await saveDatabase();
    console.log('💾 Database saved to disk');

  } catch (error) {
    console.error('❌ Error seeding market data:', error);
    throw error;
  }
}

// Execute if run directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const startTime = Date.now();
  seedAllMarketData()
    .then(() => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n⏱️  Completed in ${duration} seconds`);
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
