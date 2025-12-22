
import { initDatabase, saveDatabase, getSqliteDb } from '../db-sqlite.js';

console.log('=== SEEDING DEMO COMPANY PROFILES ===');

async function main() {
  try {
    await initDatabase();
    const sqliteDb = getSqliteDb();
    console.log('✅ Database initialized');

    // Delete existing demo companies if they exist
    console.log('\n🗑️  Removing existing demo companies...');
    sqliteDb.run(`DELETE FROM companies WHERE id IN ('demo-frigorifico-very', 'demo-global-meats', 'demo-logitrans')`);
    
    // 1. Frigoríficos Very
    console.log('\n📦 Creating Frigoríficos Very profile...');
    sqliteDb.run(`
      INSERT INTO companies (
        id, name, country, type, verified, last_updated, created_at
      ) VALUES (
        'demo-frigorifico-very',
        'Frigoríficos Very',
        'AR',
        'exporter',
        1,
        ${Date.now()},
        ${Date.now()}
      )
    `);

    // 2. Global Meats
    console.log('\n📦 Creating Global Meats profile...');
    sqliteDb.run(`
      INSERT INTO companies (
        id, name, country, type, verified, last_updated, created_at
      ) VALUES (
        'demo-global-meats',
        'Global Meats Distributors',
        'US',
        'importer',
        1,
        ${Date.now()},
        ${Date.now()}
      )
    `);

    saveDatabase();
    console.log('\n💾 Database saved successfully');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

main();
