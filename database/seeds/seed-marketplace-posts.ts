
import { initDatabase, saveDatabase, getSqliteDb } from '../db-sqlite.js';
import crypto from 'crypto';

console.log('=== SEEDING MARKETPLACE POSTS ===');

async function main() {
  try {
    await initDatabase();
    const sqliteDb = getSqliteDb();
    console.log('✅ Database initialized');

    console.log('\n👤 Creating demo users with secure passwords...');
    
    const now = Date.now();
    const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);
    const demoPassword = 'password123';

    // User 1: Frigoríficos Very
    sqliteDb.run(`
      INSERT INTO users (
        id, company_id, name, email, password, role, primary_role, verified, phone, created_at, last_active
      ) VALUES (
        'demo-user-very',
        'demo-frigorifico-very',
        'Juan Carlos Pérez',
        'jperez@frigorificovery.com.ar',
        '${demoPassword}',
        'Director de Exportaciones',
        'admin',
        1,
        '+54 11 4567-8900',
        ${now},
        ${now}
      )
    `);

    // User 2: Global Meats
    sqliteDb.run(`
      INSERT INTO users (
        id, company_id, name, email, password, role, primary_role, verified, phone, created_at, last_active
      ) VALUES (
        'demo-user-global',
        'demo-global-meats',
        'Sarah Johnson',
        'sjohnson@globalmeats.com',
        '${demoPassword}',
        'Head of International Procurement',
        'compras',
        1,
        '+1 305 555-0123',
        ${now},
        ${now}
      )
    `);

    console.log('✅ 2 users created');

    // Create marketplace posts
    console.log('\n📦 Creating marketplace posts...');

    // Post 1: Frigoríficos Very - SELL offer
    sqliteDb.run(`
      INSERT INTO marketplace_posts (
        id, company_id, user_id, type, hs_code, product_name,
        quantity, origin_country, destination_country, deadline_days,
        requirements, certifications, status, created_at, expires_at
      ) VALUES (
        'demo-post-very-1',
        'demo-frigorifico-very',
        'demo-user-very',
        'sell',
        '0201.30.00',
        'Carne vacuna premium deshuesada fresca',
        '5 toneladas',
        'AR',
        'US',
        30,
        '["Incoterms: DAP Miami", "Precio: $12,500 USD/ton", "Embarque en 12-15 días", "Contenedor refrigerado incluido"]',
        '["SENASA", "HACCP", "BRC", "Halal"]',
        'active',
        ${now},
        ${thirtyDaysFromNow}
      )
    `);

    console.log('✅ Marketplace post created');

    saveDatabase();
    console.log('\n💾 Database saved successfully');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

main();
