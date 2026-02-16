import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const dbPath = path.join(process.cwd(), 'comexia_v2.db');
const db = new Database(dbPath);

console.log('🌾 Creating test data for "Soja + Brasil" verification...\n');

try {
  // Get existing company and user IDs
  const companies = db.prepare('SELECT id FROM companies LIMIT 1').all();
  const users = db.prepare('SELECT id FROM users LIMIT 1').all();
  
  if (companies.length === 0 || users.length === 0) {
    console.log('⚠️  No companies or users found. Please run seed data first.');
    process.exit(1);
  }

  const companyId = companies[0].id;
  const userId = users[0].id;

  // Create Soybean posts from Brazil
  const soyPosts = [
    {
      id: crypto.randomUUID(),
      companyId,
      userId,
      type: 'sell',
      hsCode: '120190',
      productName: 'Porotos de Soja Orgánica Premium',
      quantity: '1000 toneladas',
      originCountry: 'BR',
      destinationCountry: 'CN',
      deadlineDays: 45,
      requirements: JSON.stringify(['Certificado Fitosanitario', 'Análisis de Calidad']),
      certifications: JSON.stringify(['SENASA', 'Orgánico Certificado', 'ISO 9001']),
      sector: 'Agriculture',
      subcategory: 'Soybeans',
      postType: 'sell',
      incoterm: 'FOB',
      price: 450.00,
      currency: 'USD',
      isEcological: 1,
      status: 'active',
      createdAt: Date.now(),
      expiresAt: Date.now() + (45 * 24 * 60 * 60 * 1000)
    },
    {
      id: crypto.randomUUID(),
      companyId,
      userId,
      type: 'buy',
      hsCode: '120100',
      productName: 'Soja No GMO para Exportación',
      quantity: '500 toneladas mensuales',
      originCountry: 'BR',
      destinationCountry: 'EU',
      deadlineDays: 30,
      requirements: JSON.stringify(['Trazabilidad Completa', 'Certificado de Origen', 'No GMO']),
      certifications: JSON.stringify(['Blockchain Verified']),
      sector: 'Agriculture',
      subcategory: 'Soybeans',
      postType: 'buy',
      incoterm: 'CIF',
      price: 420.00,
      currency: 'USD',
      isEcological: 1,
      status: 'active',
      createdAt: Date.now() - (2 * 60 * 60 * 1000),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
    },
    {
      id: crypto.randomUUID(),
      companyId,
      userId,
      type: 'sell',
      hsCode: '120190',
      productName: 'Soja Convencional Grado A',
      quantity: '2000 toneladas',
      originCountry: 'BR',
      destinationCountry: 'IN',
      deadlineDays: 60,
      requirements: JSON.stringify(['Certificado Fitosanitario']),
      certifications: JSON.stringify(['SENASA']),
      sector: 'Agriculture',
      subcategory: 'Soybeans',
      postType: 'sell',
      incoterm: 'FOB',
      price: 380.00,
      currency: 'USD',
      isEcological: 0,
      status: 'active',
      createdAt: Date.now() - (5 * 60 * 60 * 1000),
      expiresAt: Date.now() + (60 * 24 * 60 * 60 * 1000)
    }
  ];

  // Insert posts
  const insertStmt = db.prepare(`
    INSERT INTO marketplace_posts (
      id, company_id, user_id, type, hs_code, product_name, quantity,
      origin_country, destination_country, deadline_days, requirements, certifications,
      sector, subcategory, post_type, incoterm, price, currency, is_ecological,
      status, created_at, expires_at
    ) VALUES (
      @id, @companyId, @userId, @type, @hsCode, @productName, @quantity,
      @originCountry, @destinationCountry, @deadlineDays, @requirements, @certifications,
      @sector, @subcategory, @postType, @incoterm, @price, @currency, @isEcological,
      @status, @createdAt, @expiresAt
    )
  `);

  for (const post of soyPosts) {
    try {
      insertStmt.run(post);
      console.log(`✅ Created: ${post.productName} (${post.postType.toUpperCase()})`);
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint')) {
        console.log(`⚠️  Already exists: ${post.productName}`);
      } else {
        throw error;
      }
    }
  }

  console.log('\n📊 Verification Query: Soja + Brasil');
  const results = db.prepare(`
    SELECT product_name, post_type, origin_country, sector, subcategory, price, currency, is_ecological
    FROM marketplace_posts
    WHERE sector = 'Agriculture' 
      AND subcategory = 'Soybeans'
      AND origin_country = 'BR'
    ORDER BY created_at DESC
  `).all();

  console.log(`\nFound ${results.length} posts matching "Soja + Brasil":\n`);
  results.forEach((r: any, i: number) => {
    console.log(`${i + 1}. ${r.product_name}`);
    console.log(`   Type: ${r.post_type.toUpperCase()} | Origin: ${r.origin_country} | Sector: ${r.sector}`);
    console.log(`   Price: ${r.price} ${r.currency} | Ecological: ${r.is_ecological ? 'Yes' : 'No'}\n`);
  });

  console.log('✅ Test data created successfully!');
  console.log('\n🔍 Next steps:');
  console.log('1. Open http://localhost:5000/marketplace');
  console.log('2. Click on "Agriculture" sector in Smart Sidebar');
  console.log('3. Select "Soybeans" subcategory');
  console.log('4. Verify 3 posts appear from Brazil');

} catch (error: any) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  db.close();
}
