
import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const dbPath = path.join(process.cwd(), 'comexia_v2.db');
const db = new Database(dbPath);

console.log('Restoring Che.Comex data...');

try {
  // 1. Create Company
  const companyId = 'che-comex-corp';
  const existingCompany = db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId);

  if (!existingCompany) {
    console.log('Creating company: Che.Comex');
    db.prepare(`
      INSERT INTO companies (id, name, country, type, verified, created_at, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      companyId,
      'Che.Comex',
      'AR',
      'exporter',
      1,
      Date.now(),
      Date.now()
    );
  } else {
    console.log('Company Che.Comex already exists.');
  }

  // 2. Create User (Ayelen)
  const userId = 'user-ayelen-villalba';
  const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get('ayelen@che.comex.com');

  if (!existingUser) {
    console.log('Creating user: Ayelen Villalba');
    const hashedPassword = bcrypt.hashSync('password123', 10);
    db.prepare(`
      INSERT INTO users (id, company_id, name, email, password, role, primary_role, verified, created_at, last_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      companyId,
      'Ayelen Villalba',
      'ayelen@che.comex.com',
      hashedPassword,
      'CEO',
      'admin',
      1,
      Date.now(),
      Date.now()
    );
  } else {
    console.log('User Ayelen already exists.');
  }

  // 3. Create Marketplace Posts
  const posts = [
    {
      title: 'Trigo Premium Argentino',
      hs_code: '100199',
      type: 'sell',
      product_name: 'Trigo Pan',
      quantity: '5000 tons',
      origin_country: 'AR',
      destination_country: 'BR',
      description: 'Trigo de alta calidad para exportación. Cosecha 2026.',
      price: 280
    },
    {
      title: 'Maíz Amarillo Grado 2',
      hs_code: '100590',
      type: 'sell',
      product_name: 'Maíz',
      quantity: '10000 tons',
      origin_country: 'AR',
      destination_country: 'CN',
      description: 'Maíz amarillo disponible para embarque inmediato.',
      price: 195
    },
    {
      title: 'Soja - Exportación',
      hs_code: '120190',
      type: 'sell',
      product_name: 'Porotos de Soja',
      quantity: '15000 tons',
      origin_country: 'AR',
      destination_country: 'EU',
      description: 'Soja con certificación de sustentabilidad.',
      price: 420
    }
  ];

  const insertPost = db.prepare(`
    INSERT INTO marketplace_posts (
      id, company_id, user_id, type, hs_code, product_name, 
      quantity, origin_country, destination_country, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  console.log('Creating sample posts...');
  for (const post of posts) {
    // Check if similar post exists to avoid duplicates on re-run
    const exists = db.prepare('SELECT * FROM marketplace_posts WHERE user_id = ? AND hs_code = ?').get(userId, post.hs_code);
    if (!exists) {
        insertPost.run(
            crypto.randomUUID(),
            companyId,
            userId,
            post.type,
            post.hs_code,
            post.product_name,
            post.quantity,
            post.origin_country,
            post.destination_country,
            'active',
            new Date().toISOString()
        );
        console.log(`Created post: ${post.title}`);
    }
  }

  console.log('Restoration complete!');
  db.close();

} catch (error) {
  console.error('Error restoring data:', error);
}
