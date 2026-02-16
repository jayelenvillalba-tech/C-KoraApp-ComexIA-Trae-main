
import { db } from '../db-sqlite';
import { countryOpportunities, marketData, tradeAlerts } from '../../shared/schema-sqlite';
import { sql } from 'drizzle-orm';

export async function seedGlobalOpportunities() {
  console.log('🌱 Seeding Global Trade Opportunities...');

  try {
    // 1. Clear existing generic data if needed (optional, effectively upsert logic preferred usually)
    // await db.delete(countryOpportunities);

    // 2. Define Global Giants & Opportunities
    const opportunities = [
      // SOJA (1201) / TRIGO (1001) - CHINA
      {
        hsCode: '1001', // Trigo
        countryCode: 'CN',
        countryName: 'China',
        opportunityScore: 9.5,
        demandScore: 9.8,
        tariffScore: 7.0,
        logisticsScore: 8.5,
        riskScore: 3.0,
        tradeAgreements: JSON.stringify(['Protocolo Fitosanitario 2024', 'Acuerdo Bilateral']),
        avgTariffRate: 1.0,
        importVolumeGrowth: 15.5,
        marketSizeUsd: 5000000000,
        competitionLevel: 'High',
        logisticsComplexity: 'Medium'
      },
      {
        hsCode: '1201', // Soja
        countryCode: 'CN',
        countryName: 'China',
        opportunityScore: 9.8,
        demandScore: 10.0,
        tariffScore: 8.0,
        logisticsScore: 9.0,
        riskScore: 2.5,
        tradeAgreements: JSON.stringify(['Socio Estratégico Integral']),
        avgTariffRate: 0.0,
        importVolumeGrowth: 5.2,
        marketSizeUsd: 12000000000,
        competitionLevel: 'High',
        logisticsComplexity: 'Low'
      },
      // VINOS (2204) - USA & UK
      {
        hsCode: '2204',
        countryCode: 'US',
        countryName: 'Estados Unidos',
        opportunityScore: 8.9,
        demandScore: 9.0,
        tariffScore: 9.0, // Bajo arancel
        logisticsScore: 9.5,
        riskScore: 1.0,
        tradeAgreements: JSON.stringify(['GSP Eligible', 'Open Market']),
        avgTariffRate: 0.5,
        importVolumeGrowth: 3.0,
        marketSizeUsd: 800000000,
        competitionLevel: 'Very High',
        logisticsComplexity: 'Low'
      },
      {
        hsCode: '2204',
        countryCode: 'GB',
        countryName: 'Reino Unido',
        opportunityScore: 8.5,
        demandScore: 8.8,
        tariffScore: 7.5,
        logisticsScore: 8.0,
        riskScore: 2.0,
        tradeAgreements: JSON.stringify(['Post-Brexit Quotas']),
        avgTariffRate: 2.0,
        importVolumeGrowth: 2.5,
        marketSizeUsd: 400000000,
        competitionLevel: 'High',
        logisticsComplexity: 'Medium'
      },
      // CARNE (0201/0202) - EU & ISRAEL
      {
        hsCode: '0201',
        countryCode: 'DE', // Alemania (Puerta UE)
        countryName: 'Alemania (UE)',
        opportunityScore: 9.2,
        demandScore: 8.5,
        tariffScore: 6.0, // Cuota Hilton
        logisticsScore: 9.0,
        riskScore: 1.5,
        tradeAgreements: JSON.stringify(['Cuota Hilton', 'Cuota 481']),
        avgTariffRate: 20.0, // Alto fuera de cuota
        importVolumeGrowth: 1.0,
        marketSizeUsd: 600000000,
        competitionLevel: 'Medium',
        logisticsComplexity: 'High' // Frio
      },
      // SOFTWARE (8523 / Services) - USA
      {
        hsCode: '8523', // Proxy for tech/services
        countryCode: 'US',
        countryName: 'Estados Unidos',
        opportunityScore: 9.7,
        demandScore: 9.9,
        tariffScore: 10.0,
        logisticsScore: 10.0, // Digital
        riskScore: 1.0,
        tradeAgreements: JSON.stringify(['Services Protocol', 'Double Tax Treaty']),
        avgTariffRate: 0.0,
        importVolumeGrowth: 20.0,
        marketSizeUsd: 15000000000,
        competitionLevel: 'High',
        logisticsComplexity: 'None'
      }
    ];

    // Insert Opportunities
    for (const opp of opportunities) {
      await db.insert(countryOpportunities).values(opp).onConflictDoUpdate({
        target: [countryOpportunities.hsCode, countryOpportunities.countryCode],
        set: opp
      });
    }

    // 3. Define Historical Market Data (Charts)
    const histories = [
      // TRIGO Global Trend
      { hsCode: '1001', origin_country: 'AR', destination_country: 'Global', year: 2020, valueUsd: 2100000000, volume: 10500000 },
      { hsCode: '1001', origin_country: 'AR', destination_country: 'Global', year: 2021, valueUsd: 2400000000, volume: 11000000 },
      { hsCode: '1001', origin_country: 'AR', destination_country: 'Global', year: 2022, valueUsd: 3100000000, volume: 12500000 },
      { hsCode: '1001', origin_country: 'AR', destination_country: 'Global', year: 2023, valueUsd: 2800000000, volume: 10000000 }, // Drought
      { hsCode: '1001', origin_country: 'AR', destination_country: 'Global', year: 2024, valueUsd: 3500000000, volume: 14000000 }, // Recovery
      
      // SOJA Global Trend
      { hsCode: '1201', origin_country: 'AR', destination_country: 'Global', year: 2020, valueUsd: 15000000000, volume: 40000000 },
      { hsCode: '1201', origin_country: 'AR', destination_country: 'Global', year: 2021, valueUsd: 17000000000, volume: 42000000 },
      { hsCode: '1201', origin_country: 'AR', destination_country: 'Global', year: 2022, valueUsd: 19000000000, volume: 45000000 },
      { hsCode: '1201', origin_country: 'AR', destination_country: 'Global', year: 2023, valueUsd: 14000000000, volume: 30000000 },
      { hsCode: '1201', origin_country: 'AR', destination_country: 'Global', year: 2024, valueUsd: 20000000000, volume: 48000000 },
    ];

    for (const h of histories) {
        // Simple insert, assuming no conflict on ID (auto-generated)
       await db.insert(marketData).values({
           hsCode: h.hsCode,
           originCountry: h.origin_country,
           destinationCountry: h.destination_country,
           year: h.year,
           valueUsd: h.valueUsd,
           volume: h.volume,
           avgPriceUsd: h.valueUsd / h.volume
       });
    }

    console.log('✅ Global Opportunities Seeded Successfully!');
  } catch (error) {
    console.error('❌ Error seeding global opportunities:', error);
  }
}

// Auto-run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedGlobalOpportunities()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
