import { db } from '../db-sqlite';
import { marketData, countryOpportunities, marketplacePosts, companies, users } from '../../shared/schema-sqlite';

/**
 * Seed script para poblar datos REALES de Trigo (HS 1001)
 */

export async function seedTrigoRealData() {
  console.log('🌾 Seeding REAL Trigo (Wheat) data...');

  try {
    const companyList = await db.select().from(companies).limit(1);
    const userList = await db.select().from(users).limit(1);

    if (!companyList[0] || !userList[0]) {
      console.log('⚠️  No companies or users found. Run basic seeds first.');
      return;
    }

    const company = companyList[0];
    const user = userList[0];

    // 1. MARKET DATA
    console.log('📊 Inserting market data...');
    
    await db.insert(marketData).values([
      {
        id: crypto.randomUUID(),
        hsCode: '1001.99',
        originCountry: 'Argentina',
        destinationCountry: 'Brasil',
        year: 2024,
        volume: 6500000,
        valueUsd: 1950000000,
        createdAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        hsCode: '1001.99',
        originCountry: 'Argentina',
        destinationCountry: 'Indonesia',
        year: 2024,
        volume: 3200000,
        valueUsd: 960000000,
        createdAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        hsCode: '1001.99',
        originCountry: 'Argentina',
        destinationCountry: 'Argelia',
        year: 2024,
        volume: 2800000,
        valueUsd: 840000000,
        createdAt: new Date()
      }
    ]);

    console.log('✅ Market data inserted');

    // 2. TREATIES
    console.log('📜 Inserting treaties...');

    await db.insert(countryOpportunities).values([
      {
        id: crypto.randomUUID(),
        hsCode: '1001',
        countryCode: 'BR',
        countryName: 'Brasil',
        opportunityScore: 9.5,
        demandScore: 9.8,
        tariffScore: 10.0,
        marketSizeUsd: 1950000000,
        avgTariffRate: 0,
        tradeAgreements: JSON.stringify(['Mercosur - Arancel 0%']),
        competitionLevel: 'Medium'
      },
      {
        id: crypto.randomUUID(),
        hsCode: '1001',
        countryCode: 'CL',
        countryName: 'Chile',
        opportunityScore: 8.5,
        demandScore: 8.0,
        tariffScore: 10.0,
        marketSizeUsd: 450000000,
        avgTariffRate: 0,
        tradeAgreements: JSON.stringify(['ACE 35 - Arancel 0%']),
        competitionLevel: 'Low'
      }
    ]);

    console.log('✅ Treaties inserted');

    // 3. MARKETPLACE
    console.log('🔥 Inserting marketplace posts...');

    await db.insert(marketplacePosts).values([
      {
        id: crypto.randomUUID(),
        companyId: company.id,
        userId: user.id,
        type: 'buy',
        hsCode: '1001.99',
        productName: 'Trigo Hard Red Winter',
        quantity: '50000 tons',
        originCountry: 'Indonesia',
        destinationCountry: 'Argentina',
        deadlineDays: 45,
        status: 'active',
        description: 'Buscamos proveedor de trigo argentino. CIF Jakarta.',
        createdAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        companyId: company.id,
        userId: user.id,
        type: 'buy',
        hsCode: '1001.99',
        productName: 'Trigo Pan Alta Proteína',
        quantity: '30000 tons',
        originCountry: 'Indonesia',
        destinationCountry: 'Argentina',
        deadlineDays: 30,
        status: 'active',
        description: 'Molino industrial requiere trigo panificable.',
        createdAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        companyId: company.id,
        userId: user.id,
        type: 'buy',
        hsCode: '1001.99',
        productName: 'Trigo Blando Grado 1',
        quantity: '100000 tons',
        originCountry: 'Brasil',
        destinationCountry: 'Argentina',
        deadlineDays: 60,
        status: 'active',
        description: 'Grupo de molinos brasileños busca trigo argentino.',
        createdAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        companyId: company.id,
        userId: user.id,
        type: 'buy',
        hsCode: '1001.99',
        productName: 'Trigo Duro Exportación',
        quantity: '75000 tons',
        originCountry: 'Argelia',
        destinationCountry: 'Argentina',
        deadlineDays: 90,
        status: 'active',
        description: 'OAIC Argelia - Licitación pública.',
        createdAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        companyId: company.id,
        userId: user.id,
        type: 'buy',
        hsCode: '1001.99',
        productName: 'Trigo Forrajero',
        quantity: '25000 tons',
        originCountry: 'Argelia',
        destinationCountry: 'Argentina',
        deadlineDays: 45,
        status: 'active',
        description: 'Importador argelino busca trigo feed.',
        createdAt: new Date()
      }
    ]);

    console.log('✅ Marketplace posts inserted');
    console.log('\n✅ SEED COMPLETED!');
    console.log('🎯 Expected for HS 1001:');
    console.log('   Top 3: Brasil (6.5M), Indonesia (3.2M), Argelia (2.8M)');
    console.log('   Treaties: Brasil (Mercosur), Chile (ACE 35)');
    console.log('   Che.Comex: Argelia (2), Indonesia (2), Brasil (1)');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedTrigoRealData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
