import { initDatabase, sqliteDb, saveDatabase } from '../db-sqlite.js';
import crypto from 'crypto';

console.log('=== SEED: 48 Empresas Adicionales ===\n');

const COUNTRIES = ['AR', 'BR', 'CL', 'UY', 'PY', 'US', 'MX', 'CN', 'DE', 'ES', 'IT', 'FR'];
const TYPES = ['importer', 'exporter', 'both'];
const BUSINESS_TYPES = ['SA', 'SRL', 'LLC', 'Corp'];

async function main() {
  try {
    await initDatabase();
    
    console.log('🏢 Generando 48 empresas adicionales...\n');
    
    let inserted = 0;
    
    for (let i = 3; i <= 50; i++) {
      const country = COUNTRIES[i % COUNTRIES.length];
      const type = TYPES[i % TYPES.length];
      const businessType = BUSINESS_TYPES[i % BUSINESS_TYPES.length];
      
      try {
        sqliteDb.run(
          `INSERT INTO companies (
            id, name, country, type, verified, contact_email, website,
            legal_name, tax_id, business_type, established_year,
            employee_count, contact_person, phone, address, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            crypto.randomUUID(),
            `Empresa Comercial ${i}`,
            country,
            type,
            i % 3 === 0 ? 1 : 0, // 1/3 verificadas
            `contact${i}@empresa${i}.com`,
            `https://empresa${i}.com`,
            `Empresa Comercial ${i} ${businessType}`,
            `TAX-${country}-${String(i).padStart(6, '0')}`,
            businessType,
            2000 + (i % 24), // Años entre 2000-2024
            (i * 10) % 500, // Empleados entre 0-500
            `Director ${i}`,
            `+${i}123456789`,
            `Calle ${i}, Ciudad, ${country}`,
            new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
          ]
        );
        inserted++;
        if (inserted % 10 === 0) process.stdout.write('.');
      } catch (error: any) {
        if (!error.message.includes('UNIQUE')) {
          console.error(`Error insertando empresa ${i}:`, error.message);
        }
      }
    }
    
    console.log(`\n✅ ${inserted} empresas insertadas`);
    
    saveDatabase();
    
    const total = sqliteDb.exec('SELECT COUNT(*) FROM companies')[0]?.values[0][0] || 0;
    const verified = sqliteDb.exec('SELECT COUNT(*) FROM companies WHERE verified = 1')[0]?.values[0][0] || 0;
    
    console.log(`\n📊 TOTALES:`);
    console.log(`   - Empresas totales: ${total}`);
    console.log(`   - Empresas verificadas: ${verified}`);
    console.log('💾 Database saved\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
