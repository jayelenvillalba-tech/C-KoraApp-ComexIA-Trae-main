import { initDatabase, sqliteDb, saveDatabase } from '../db-sqlite.js';

console.log('=== MIGRATION: Add News Table ===\n');

async function migrate() {
  try {
    await initDatabase();
    
    console.log('📰 Creating news table...');
    
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS news (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT,
        content TEXT,
        category TEXT,
        source TEXT,
        image_url TEXT,
        date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ News table created successfully');
    
    // Create index for category filtering
    sqliteDb.run(`
      CREATE INDEX IF NOT EXISTS idx_news_category 
      ON news(category)
    `);
    
    sqliteDb.run(`
      CREATE INDEX IF NOT EXISTS idx_news_date 
      ON news(date DESC)
    `);
    
    console.log('✅ Indexes created');
    
    saveDatabase();
    console.log('💾 Database saved\n');
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
