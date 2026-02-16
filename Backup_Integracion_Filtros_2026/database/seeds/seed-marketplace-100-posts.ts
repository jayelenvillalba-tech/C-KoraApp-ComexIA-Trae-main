import { initDatabase, sqliteDb, saveDatabase } from '../db-sqlite.js';
import crypto from 'crypto';

console.log('=== SEED: 100 Publicaciones Marketplace ===\n');

const POST_TYPES = ['sell', 'buy'];
const PRODUCTS = [
  'Carne Bovina Premium', 'Carne Porcina', 'Pollo Congelado', 'Soja No GMO',
  'Maíz Amarillo', 'Trigo Pan', 'Aceite de Soja Refinado', 'Harina de Soja',
  'Vino Malbec', 'Frutas Frescas', 'Maquinaria Agrícola', 'Autopartes',
  'Textiles de Algodón', 'Cuero Bovino', 'Lácteos', 'Pescado Congelado'
];

const COUNTRIES = ['AR', 'BR', 'CL', 'UY', 'PY', 'US', 'CN', 'ES', 'DE', 'IT', 'FR', 'GB'];

async function main() {
  try {
    await initDatabase();
    
    // Obtener empresas existentes
    const companiesResult = sqliteDb.exec('SELECT id, name FROM companies LIMIT 50');
    const companies = companiesResult[0]?.values.map(row => ({ id: row[0], name: row[1] })) || [];
    
    if (companies.length === 0) {
      console.error('❌ No hay empresas en la base de datos. Ejecuta seed-companies-employees.ts primero.');
      process.exit(1);
    }
    
    console.log(`📊 Generando 100 publicaciones para ${companies.length} empresas...\n`);
    
    let inserted = 0;
    
    for (let i = 0; i < 100; i++) {
      const company = companies[i % companies.length];
      const type = POST_TYPES[i % 2];
      const product = PRODUCTS[i % PRODUCTS.length];
      const originCountry = COUNTRIES[i % COUNTRIES.length];
      const destCountry = COUNTRIES[(i + 1) % COUNTRIES.length];
      
      const quantity = `${(i + 1) * 100} ${i % 2 === 0 ? 'tons' : 'units'}`;
      const price = type === 'sell' ? `USD ${(i + 1) * 1000}` : null;
      
      try {
        sqliteDb.run(
          `INSERT INTO marketplace_posts (
            id, company_id, company_name, type, product_name, hs_code,
            quantity, origin_country, destination_country, price, description,
            status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            crypto.randomUUID(),
            company.id,
            company.name,
            type,
            product,
            `${String(i % 98 + 1).padStart(2, '0')}0${String(i % 10).padStart(2, '0')}00`, // HS code mock
            quantity,
            originCountry,
            destCountry,
            price,
            `${type === 'sell' ? 'Oferta' : 'Demanda'} de ${product}. Producto de alta calidad con certificaciones internacionales.`,
            'active',
            new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString()
          ]
        );
        inserted++;
        if (inserted % 10 === 0) process.stdout.write('.');
      } catch (error: any) {
        if (!error.message.includes('UNIQUE constraint')) {
          console.error(`Error insertando post ${i}:`, error.message);
        }
      }
    }
    
    console.log(`\n✅ ${inserted} publicaciones insertadas`);
    
    saveDatabase();
    
    const total = sqliteDb.exec('SELECT COUNT(*) FROM marketplace_posts')[0]?.values[0][0] || 0;
    const active = sqliteDb.exec('SELECT COUNT(*) FROM marketplace_posts WHERE status = "active"')[0]?.values[0][0] || 0;
    
    console.log(`\n📊 TOTALES:`);
    console.log(`   - Publicaciones totales: ${total}`);
    console.log(`   - Publicaciones activas: ${active}`);
    console.log('💾 Database saved\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
