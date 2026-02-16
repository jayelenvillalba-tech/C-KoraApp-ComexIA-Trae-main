import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const dbPath = path.join(process.cwd(), 'comexia_v2.db');
const db = new Database(dbPath);

console.log('🌱 Creating Phase 21 test data: Soja AR-BR with photos and trade preferences...\n');

try {
  // Get or create test company
  const company = db.prepare(`
    SELECT * FROM companies WHERE name = 'AgroExport SA' LIMIT 1
  `).get();

  let companyId: string;
  if (!company) {
    companyId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO companies (id, name, country, type, verified, verification_level, business_role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(companyId, 'AgroExport SA', 'AR', 'exporter', 1, 'verified', 'trader');
    console.log('✅ Created company: AgroExport SA (verified)');
  } else {
    companyId = (company as any).id;
    // Update verification level
    db.prepare(`
      UPDATE companies SET verification_level = 'verified', business_role = 'trader' WHERE id = ?
    `).run(companyId);
    console.log('✅ Updated company: AgroExport SA');
  }

  // Get or create test user
  const user = db.prepare(`
    SELECT * FROM users WHERE email = 'juan.perez@agroexport.com' LIMIT 1
  `).get();

  let userId: string;
  if (!user) {
    userId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO users (id, email, name, role, company_id, verified)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, 'juan.perez@agroexport.com', 'Juan Pérez', 'Export Manager', companyId, 1);
    console.log('✅ Created user: Juan Pérez');
  } else {
    userId = (user as any).id;
    console.log('✅ User exists: Juan Pérez');
  }

  // Create marketplace post with Phase 21 features
  const postId = crypto.randomUUID();
  const photos = JSON.stringify([
    '/uploads/marketplace/soja-1.jpg',
    '/uploads/marketplace/soja-2.jpg',
    '/uploads/marketplace/soja-3.jpg'
  ]);

  const descriptionLong = `Soja orgánica certificada de primera calidad, cosecha 2026. 

**Especificaciones Técnicas:**
- Proteína: 38-40%
- Humedad: máx 14%
- Impurezas: máx 1%
- Granos dañados: máx 2%

**Certificaciones:**
- SENASA Argentina
- Certificación Orgánica IFOAM
- Trazabilidad Blockchain completa
- Inspección SGS disponible

**Logística:**
- Origen: Puerto de Rosario, Argentina
- Incoterm: FOB
- Contenido Regional MERCOSUR: 100%
- Embalaje: Big bags de 1 tonelada

**Preferencias Arancelarias:**
✓ MERCOSUR: 0% arancel para Brasil, Uruguay, Paraguay
✓ Cumple requisitos de contenido regional (60%)

Empresa verificada con 15 años de experiencia en exportación de granos. Respuesta garantizada en 24hs.`;

  const certifications = JSON.stringify(['SENASA', 'IFOAM Organic', 'Blockchain Traceability', 'SGS Inspection']);

  db.prepare(`
    INSERT INTO marketplace_posts (
      id, company_id, user_id, type, post_type, hs_code, product_name,
      quantity, origin_country, destination_country, deadline_days,
      sector, subcategory, incoterm, price, currency, is_ecological,
      certifications, status, created_at,
      description_long, photos, moq, inspection_available, regional_content_percentage
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    postId,
    companyId,
    userId,
    'sell',
    'sell',
    '120190',
    'Soja Orgánica Premium',
    '5000 toneladas',
    'AR',
    'BR',
    30,
    'Agriculture',
    'Soybeans',
    'FOB',
    450,
    'USD',
    1,
    certifications,
    'active',
    new Date().toISOString(),
    descriptionLong,
    photos,
    '500 toneladas',
    1,
    100
  );

  console.log('✅ Created marketplace post: Soja Orgánica Premium');
  console.log('   - HS Code: 120190');
  console.log('   - Route: AR → BR (MERCOSUR 0%)');
  console.log('   - Photos: 3 images');
  console.log('   - Long description: Alibaba-style');
  console.log('   - MOQ: 500 toneladas');
  console.log('   - Regional content: 100%');

  // Create second post for variety
  const postId2 = crypto.randomUUID();
  db.prepare(`
    INSERT INTO marketplace_posts (
      id, company_id, user_id, type, post_type, hs_code, product_name,
      quantity, origin_country, destination_country, deadline_days,
      sector, subcategory, incoterm, price, currency, is_ecological,
      certifications, status, created_at,
      description_long, moq
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    postId2,
    companyId,
    userId,
    'buy',
    'buy',
    '020230',
    'Carne Bovina Congelada',
    '2000 toneladas',
    'UY',
    'AR',
    45,
    'Agriculture',
    'Beef',
    'CIF',
    3500,
    'USD',
    0,
    JSON.stringify(['SENASA', 'Halal']),
    'active',
    new Date().toISOString(),
    'Buscamos carne bovina congelada de alta calidad para distribución en Argentina. Preferencia por proveedores MERCOSUR con certificación Halal.',
    '100 toneladas'
  );

  console.log('✅ Created second post: Carne Bovina (UY → AR)');

  console.log('\n✅ Test data created successfully!');
  console.log('\n📊 Summary:');
  console.log('   - Company: AgroExport SA (verified)');
  console.log('   - User: Juan Pérez');
  console.log('   - Posts: 2 (1 sell, 1 buy)');
  console.log('   - Trade routes: AR→BR, UY→AR (both MERCOSUR)');

} catch (error: any) {
  console.error('❌ Error creating test data:', error.message);
  process.exit(1);
} finally {
  db.close();
}
