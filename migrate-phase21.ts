import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'comexia_v2.db');
const db = new Database(dbPath);

console.log('🔧 Migrating database for Phase 21: Advanced Marketplace Features...\n');

try {
  // Add new columns to marketplace_posts
  const marketplaceMigrations = [
    'ALTER TABLE marketplace_posts ADD COLUMN description_long TEXT',
    'ALTER TABLE marketplace_posts ADD COLUMN photos TEXT',
    'ALTER TABLE marketplace_posts ADD COLUMN moq TEXT',
    'ALTER TABLE marketplace_posts ADD COLUMN inspection_available INTEGER DEFAULT 0',
    'ALTER TABLE marketplace_posts ADD COLUMN regional_content_percentage INTEGER',
    'ALTER TABLE marketplace_posts ADD COLUMN trade_preferences TEXT'
  ];

  console.log('📦 Updating marketplace_posts table...');
  for (const migration of marketplaceMigrations) {
    try {
      db.exec(migration);
      const columnName = migration.split('ADD COLUMN')[1]?.split(' ')[1];
      console.log(`  ✅ Added: ${columnName}`);
    } catch (error: any) {
      if (error.message.includes('duplicate column')) {
        const columnName = migration.split('ADD COLUMN')[1]?.split(' ')[1];
        console.log(`  ⚠️  Already exists: ${columnName}`);
      } else {
        throw error;
      }
    }
  }

  // Add new columns to companies
  const companiesMigrations = [
    'ALTER TABLE companies ADD COLUMN verification_level TEXT DEFAULT "basic"',
    'ALTER TABLE companies ADD COLUMN business_role TEXT DEFAULT "trader"'
  ];

  console.log('\n🏢 Updating companies table...');
  for (const migration of companiesMigrations) {
    try {
      db.exec(migration);
      const columnName = migration.split('ADD COLUMN')[1]?.split(' ')[1];
      console.log(`  ✅ Added: ${columnName}`);
    } catch (error: any) {
      if (error.message.includes('duplicate column')) {
        const columnName = migration.split('ADD COLUMN')[1]?.split(' ')[1];
        console.log(`  ⚠️  Already exists: ${columnName}`);
      } else {
        throw error;
      }
    }
  }

  console.log('\n✅ Phase 21 migration completed successfully!');
  
  // Verify schema
  console.log('\n📊 Verifying marketplace_posts schema...');
  const postsInfo = db.prepare('PRAGMA table_info(marketplace_posts)').all();
  const newPostsColumns = postsInfo.filter((col: any) => 
    ['description_long', 'photos', 'moq', 'inspection_available', 'regional_content_percentage', 'trade_preferences'].includes(col.name)
  );
  console.log(`Found ${newPostsColumns.length}/6 new columns in marketplace_posts`);

  console.log('\n📊 Verifying companies schema...');
  const companiesInfo = db.prepare('PRAGMA table_info(companies)').all();
  const newCompaniesColumns = companiesInfo.filter((col: any) => 
    ['verification_level', 'business_role'].includes(col.name)
  );
  console.log(`Found ${newCompaniesColumns.length}/2 new columns in companies`);

} catch (error: any) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
