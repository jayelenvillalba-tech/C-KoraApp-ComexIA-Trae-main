import { initDatabase, sqliteDb, saveDatabase } from '../db-sqlite.js';
import crypto from 'crypto';

console.log('=== SEED COMPLETO: Empleados, Marketplace, News, Verifications, Subscriptions ===\n');

async function main() {
  try {
    await initDatabase();
    
    // 1. EMPLEADOS (200)
    console.log('👥 Seeding 200 employees...');
    const companiesResult = sqliteDb.exec('SELECT id FROM companies LIMIT 50');
    const companyIds = companiesResult[0]?.values.map(row => row[0] as string) || [];
    
    const firstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Laura', 'Diego', 'Sofia', 'Miguel', 'Elena'];
    const lastNames = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez'];
    const roles = ['CEO', 'Sales Manager', 'Export Manager', 'Logistics Manager'];
    
    let employeesInserted = 0;
    for (let i = 0; i < 200; i++) {
      const companyId = companyIds[i % companyIds.length];
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const role = roles[i % roles.length];
      
      try {
        sqliteDb.run(
          `INSERT INTO users (id, company_id, name, email, password, role, verified, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            crypto.randomUUID(),
            companyId,
            `${firstName} ${lastName}`,
            `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@company.com`,
            '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
            role,
            i % 3 === 0 ? 1 : 0,
            new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString()
          ]
        );
        employeesInserted++;
        if (employeesInserted % 20 === 0) process.stdout.write('.');
      } catch (e: any) {
        if (!e.message.includes('UNIQUE')) console.error(`Error employee ${i}:`, e.message);
      }
    }
    console.log(`\n✅ ${employeesInserted} employees inserted`);
    
    // 2. MARKETPLACE POSTS (100)
    console.log('\n🛒 Seeding 100 marketplace posts...');
    const usersResult = sqliteDb.exec('SELECT id, company_id FROM users LIMIT 200');
    const users = usersResult[0]?.values.map(row => ({ id: row[0], companyId: row[1] })) || [];
    
    const products = ['Carne Bovina', 'Soja', 'Maíz', 'Trigo', 'Aceite de Soja', 'Vino', 'Frutas'];
    const countries = ['AR', 'BR', 'CL', 'UY', 'US', 'CN', 'ES', 'DE'];
    
    let postsInserted = 0;
    for (let i = 0; i < 100; i++) {
      const user = users[i % users.length];
      try {
        sqliteDb.run(
          `INSERT INTO marketplace_posts (id, company_id, user_id, type, hs_code, product_name, quantity, origin_country, destination_country, status, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            crypto.randomUUID(),
            user.companyId,
            user.id,
            i % 2 === 0 ? 'sell' : 'buy',
            `${String(i % 98 + 1).padStart(2, '0')}0100`,
            products[i % products.length],
            `${(i + 1) * 100} tons`,
            countries[i % countries.length],
            countries[(i + 1) % countries.length],
            'active',
            new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString()
          ]
        );
        postsInserted++;
        if (postsInserted % 10 === 0) process.stdout.write('.');
      } catch (e: any) {
        if (!e.message.includes('UNIQUE')) console.error(`Error post ${i}:`, e.message);
      }
    }
    console.log(`\n✅ ${postsInserted} marketplace posts inserted`);
    
    // 3. NEWS (50)
    console.log('\n📰 Seeding 50 news articles...');
    const categories = ['regulacion', 'logistica', 'mercado'];
    const sources = ['SENASA', 'AFIP', 'INDEC', 'OMC', 'Reuters'];
    
    let newsInserted = 0;
    for (let i = 0; i < 50; i++) {
      try {
        sqliteDb.run(
          `INSERT INTO news (id, title, summary, content, category, source, date, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            crypto.randomUUID(),
            `Actualización regulatoria ${i + 1}`,
            `Resumen de noticia ${i + 1} sobre comercio internacional`,
            `Contenido completo de la noticia ${i + 1}. Información relevante para exportadores e importadores.`,
            categories[i % categories.length],
            sources[i % sources.length],
            new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
            new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
          ]
        );
        newsInserted++;
        if (newsInserted % 10 === 0) process.stdout.write('.');
      } catch (e: any) {
        if (!e.message.includes('UNIQUE')) console.error(`Error news ${i}:`, e.message);
      }
    }
    console.log(`\n✅ ${newsInserted} news articles inserted`);
    
    // 4. VERIFICATIONS (20)
    console.log('\n✅ Seeding 20 pending verifications...');
    let verificationsInserted = 0;
    for (let i = 0; i < 20; i++) {
      const entityType = i % 2 === 0 ? 'company' : 'employee';
      const entityId = entityType === 'company' ? companyIds[i % companyIds.length] : users[i % users.length].id;
      
      try {
        sqliteDb.run(
          `INSERT INTO verifications (id, entity_type, entity_id, verification_type, status, documents, notes, submitted_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            crypto.randomUUID(),
            entityType,
            entityId,
            'identity',
            'pending',
            JSON.stringify(['/uploads/doc1.pdf', '/uploads/doc2.pdf']),
            `Verificación ${i + 1} pendiente de revisión`,
            new Date(Date.now() - i * 6 * 60 * 60 * 1000).toISOString()
          ]
        );
        verificationsInserted++;
      } catch (e: any) {
        if (!e.message.includes('UNIQUE')) console.error(`Error verification ${i}:`, e.message);
      }
    }
    console.log(`✅ ${verificationsInserted} verifications inserted`);
    
    // 5. SUBSCRIPTIONS (10)
    console.log('\n💳 Seeding 10 active subscriptions...');
    const plans = ['pyme', 'multinacional'];
    const prices = { pyme: 49, multinacional: 199 };
    const maxEmployees = { pyme: 5, multinacional: 100 };
    
    let subscriptionsInserted = 0;
    for (let i = 0; i < 10; i++) {
      const plan = plans[i % 2];
      try {
        sqliteDb.run(
          `INSERT INTO subscriptions (id, company_id, plan_type, status, max_employees, current_employees, monthly_price, start_date, next_billing_date) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            crypto.randomUUID(),
            companyIds[i % companyIds.length],
            plan,
            'active',
            maxEmployees[plan as keyof typeof maxEmployees],
            i + 1,
            prices[plan as keyof typeof prices],
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          ]
        );
        subscriptionsInserted++;
      } catch (e: any) {
        if (!e.message.includes('UNIQUE')) console.error(`Error subscription ${i}:`, e.message);
      }
    }
    console.log(`✅ ${subscriptionsInserted} subscriptions inserted`);
    
    saveDatabase();
    
    // FINAL STATS
    console.log('\n\n📊 ========== RESUMEN FINAL ==========');
    const stats = {
      hsCodes: sqliteDb.exec('SELECT COUNT(*) FROM hs_subpartidas')[0]?.values[0][0],
      companies: sqliteDb.exec('SELECT COUNT(*) FROM companies')[0]?.values[0][0],
      users: sqliteDb.exec('SELECT COUNT(*) FROM users')[0]?.values[0][0],
      posts: sqliteDb.exec('SELECT COUNT(*) FROM marketplace_posts')[0]?.values[0][0],
      news: sqliteDb.exec('SELECT COUNT(*) FROM news')[0]?.values[0][0],
      verifications: sqliteDb.exec('SELECT COUNT(*) FROM verifications')[0]?.values[0][0],
      subscriptions: sqliteDb.exec('SELECT COUNT(*) FROM subscriptions')[0]?.values[0][0]
    };
    
    console.log(`✅ HS Codes: ${stats.hsCodes}`);
    console.log(`✅ Companies: ${stats.companies}`);
    console.log(`✅ Employees: ${stats.users}`);
    console.log(`✅ Marketplace Posts: ${stats.posts}`);
    console.log(`✅ News Articles: ${stats.news}`);
    console.log(`✅ Pending Verifications: ${stats.verifications}`);
    console.log(`✅ Active Subscriptions: ${stats.subscriptions}`);
    console.log('\n🎉 ¡BASE DE DATOS COMPLETA!\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
