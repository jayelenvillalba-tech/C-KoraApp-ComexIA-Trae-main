import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'comexia_v2.db');
const db = new Database(dbPath);

console.log('🔧 Migrating marketplace_posts table for Smart Filters...\n');

try {
  // Add new columns to marketplace_posts table
  const migrations = [
    'ALTER TABLE marketplace_posts ADD COLUMN sector TEXT',
    'ALTER TABLE marketplace_posts ADD COLUMN subcategory TEXT',
    'ALTER TABLE marketplace_posts ADD COLUMN post_type TEXT DEFAULT "buy"',
    'ALTER TABLE marketplace_posts ADD COLUMN incoterm TEXT',
    'ALTER TABLE marketplace_posts ADD COLUMN price REAL',
    'ALTER TABLE marketplace_posts ADD COLUMN currency TEXT DEFAULT "USD"',
    'ALTER TABLE marketplace_posts ADD COLUMN is_ecological INTEGER DEFAULT 0'
  ];

  for (const migration of migrations) {
    try {
      db.exec(migration);
      console.log(`✅ ${migration.split('ADD COLUMN')[1]?.trim() || migration}`);
    } catch (error: any) {
      // Column might already exist
      if (error.message.includes('duplicate column')) {
        console.log(`⚠️  Column already exists: ${migration.split('ADD COLUMN')[1]?.trim()}`);
      } else {
        throw error;
      }
    }
  }

  console.log('\n✅ Migration completed successfully!');
  console.log('\n📊 Verifying schema...');
  
  // Verify the schema
  const tableInfo = db.prepare('PRAGMA table_info(marketplace_posts)').all();
  console.log('\nCurrent marketplace_posts columns:');
  tableInfo.forEach((col: any) => {
    console.log(`  - ${col.name} (${col.type})`);
  });

} catch (error: any) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
