
import { db } from '../db-sqlite';
import { marketplacePosts, companies, users } from '../../shared/schema-sqlite';
import { sql } from 'drizzle-orm';

export async function seedMarketplace() {
  console.log('🌱 Seeding Marketplace Posts...');

  try {
    // 1. Ensure we have a dummy company/user to attach posts to
    const company = await db.select().from(companies).limit(1);
    const user = await db.select().from(users).limit(1);

    if (!company[0] || !user[0]) {
        console.warn('⚠️ No company/user found. Skipping marketplace seed.');
        return;
    }

    const companyId = company[0].id;
    const userId = user[0].id;

    // 2. Define Posts (Lat/Lon will be derived by frontend based on country for now, or we can add precise locations if schema supports)
    // We are trusting frontend `getCountryCoords` and jitter for now.
    
    const posts = [
      // SOJA (1201) - BUYERS
      {
        id: crypto.randomUUID(),
        companyId,
        userId,
        type: 'buy',
        hsCode: '1201.90',
        productName: 'Soja Premium GMO-Free',
        quantity: 50000, // tons
        originCountry: 'China', // Buyer loc
        destinationCountry: 'Global',
        deadlineDays: 30,
        status: 'active',
        createdAt: new Date(),
        description: 'Buscamos proveedores de soja a largo plazo.'
      },
      {
        id: crypto.randomUUID(),
        companyId,
        userId,
        type: 'buy',
        hsCode: '1201.00',
        productName: 'Soja a Granel',
        quantity: 20000,
        originCountry: 'India',
        destinationCountry: 'Global',
        deadlineDays: 15,
        status: 'active',
        createdAt: new Date(),
        description: 'Compra spot para procesamiento.'
      },
      // TRIGO (1001) - BUYERS
      {
        id: crypto.randomUUID(),
        companyId,
        userId,
        type: 'buy',
        hsCode: '1001.99',
        productName: 'Trigo Hard Red Winter',
        quantity: 10000,
        originCountry: 'Brasil',
        destinationCountry: 'Argentina',
        deadlineDays: 45,
        status: 'active',
        createdAt: new Date(),
        description: 'Requerido para molinos en el sur.'
      },
      {
        id: crypto.randomUUID(),
        companyId,
        userId,
        type: 'sell', // Competitor?
        hsCode: '1001.19',
        productName: 'Trigo Calidad Superior',
        quantity: 5000,
        originCountry: 'Australia',
        destinationCountry: 'Global',
        deadlineDays: 60,
        status: 'active',
        createdAt: new Date(),
        description: 'Disponible para exportación inmediata.'
      },
       // VINOS (2204)
      {
        id: crypto.randomUUID(),
        companyId,
        userId,
        type: 'buy',
        hsCode: '2204.21',
        productName: 'Vino Malbec Gran Reserva',
        quantity: 2000, // bottles
        originCountry: 'Estados Unidos',
        destinationCountry: 'Global',
        deadlineDays: 90,
        status: 'active',
        createdAt: new Date(),
        description: 'Cadena de restaurantes busca proveedor directo.'
      },
      {
        id: crypto.randomUUID(),
        companyId,
        userId,
        type: 'buy',
        hsCode: '2204.10',
        productName: 'Vino Espumante',
        quantity: 5000,
        originCountry: 'Reino Unido',
        destinationCountry: 'Global',
        deadlineDays: 20,
        status: 'active',
        createdAt: new Date(),
        description: 'Distribuidor local.'
      }
    ];

    for (const post of posts) {
      // Use SQL insert to ignore conflicts or just insert
      await db.insert(marketplacePosts).values(post);
    }

    console.log('✅ Marketplace Posts Seeded!');
  } catch (error) {
    console.error('❌ Error seeding marketplace:', error);
  }
}

// Auto-run
if (import.meta.url === `file://${process.argv[1]}`) {
  seedMarketplace()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
