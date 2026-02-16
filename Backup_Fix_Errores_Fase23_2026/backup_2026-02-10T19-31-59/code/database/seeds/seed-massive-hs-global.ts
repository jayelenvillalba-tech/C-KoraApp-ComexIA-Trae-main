
import { db } from '../db-sqlite';
import { marketplacePosts, companies, users, countryOpportunities } from '../../shared/schema-sqlite';
import { sql } from 'drizzle-orm';

// Realistic Market Logic
const MARKET_PATTERNS: Record<string, any> = {
  // SOJA & CEREALES (10, 12)
  '1201': { buyers: ['CN', 'IN', 'NL', 'EG'], sellers: ['BR', 'US', 'AR'], section: 'Agro' },
  '1001': { buyers: ['ID', 'BR', 'DZ', 'IT'], sellers: ['RU', 'US', 'CA', 'AR'], section: 'Agro' },
  
  // VINOS (2204)
  '2204': { buyers: ['US', 'GB', 'DE', 'CA', 'BR'], sellers: ['FR', 'IT', 'ES', 'AR', 'CL'], section: 'Consumo' },
  
  // CARNE (0201, 0202)
  '0201': { buyers: ['CN', 'US', 'IL', 'DE'], sellers: ['BR', 'AU', 'AR', 'US'], section: 'Agro' },
  
  // LITIO & MINERALES (2836)
  '2836': { buyers: ['CN', 'KR', 'JP', 'US'], sellers: ['CL', 'AU', 'AR'], section: 'Mineria' },
  
  // SOFTWARE (8523 - Proxy)
  '8523': { buyers: ['US', 'DE', 'GB', 'MX'], sellers: ['IN', 'US', 'IL', 'AR', 'UA'], section: 'Servicios' }
};

const COUNTRIES: Record<string, string> = {
    'CN': 'China', 'IN': 'India', 'NL': 'Países Bajos', 'EG': 'Egipto',
    'BR': 'Brasil', 'US': 'Estados Unidos', 'AR': 'Argentina', 'ID': 'Indonesia',
    'DZ': 'Argelia', 'IT': 'Italia', 'RU': 'Rusia', 'CA': 'Canadá',
    'GB': 'Reino Unido', 'DE': 'Alemania', 'FR': 'Francia', 'ES': 'España',
    'CL': 'Chile', 'IL': 'Israel', 'AU': 'Australia', 'KR': 'Corea del Sur',
    'JP': 'Japón', 'MX': 'México', 'UA': 'Ucrania'
};

export async function seedMassive() {
  console.log('🌍 Starting MASSIVE Global Simulation...');

  try {
     // Get a base company to attach to
     const company = await db.select().from(companies).limit(1);
     const user = await db.select().from(users).limit(1);
     
     if (!company[0]) { console.log('Skipping: No companies.'); return; }

     for (const [hsCode, pattern] of Object.entries(MARKET_PATTERNS)) {
        console.log(`Processing Sector: ${hsCode} (${pattern.section})`);

        // 1. Generate BUY Requests (Export Opportunities for User)
        for (const buyerCode of pattern.buyers) {
            const countryName = COUNTRIES[buyerCode];
            const numPosts = Math.floor(Math.random() * 4) + 2; // 2-5 posts per country

            for (let i = 0; i < numPosts; i++) {
                await db.insert(marketplacePosts).values({
                    id: crypto.randomUUID(),
                    companyId: company[0].id,
                    userId: user[0].id,
                    type: 'buy',
                    hsCode: hsCode, // Exact match
                    productName: `Requerimiento Industrial ${hsCode} - Grade ${String.fromCharCode(65+i)}`,
                    quantity: `${Math.floor(Math.random() * 5000) + 100} tons`,
                    originCountry: countryName, // The buyer is HERE
                    destinationCountry: 'Global',
                    deadlineDays: 30,
                    status: 'active',
                    createdAt: new Date(),
                    description: `Buscamos proveedor confiable de ${hsCode} para contrato anual. CIF ${countryName}.`
                });
            }

            // 2. Generate Macro Opportunity Data (Backing Data)
            await db.insert(countryOpportunities).values({
                id: crypto.randomUUID(),
                hsCode: hsCode,
                countryCode: buyerCode,
                countryName: countryName,
                opportunityScore: 8.5 + Math.random(), // High score
                demandScore: 9.0,
                tariffScore: 7.0,
                marketSizeUsd: 500000000 * (Math.random() + 0.5),
                avgTariffRate: 5.0,
                tradeAgreements: JSON.stringify(['Nación Más Favorecida', 'OMC']),
                competitionLevel: 'High'
            });
        }
     }

     console.log('✅ MASSIVE Seed Completed. The world is now populated.');
  } catch (error) {
    console.error('❌ Error seeding massive data:', error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedMassive()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
