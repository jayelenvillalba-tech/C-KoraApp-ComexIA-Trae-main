import { initDatabase, sqliteDb, saveDatabase } from '../db-sqlite.js';

console.log('=== MIGRATION: Add Verifications Table ===\n');

async function migrate() {
  try {
    await initDatabase();
    
    console.log('📋 Creating verifications table...');
    
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS verifications (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        entity_name TEXT,
        verification_type TEXT,
        documents TEXT,
        notes TEXT,
        status TEXT DEFAULT 'pending',
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewed_at DATETIME,
        reviewed_by TEXT
      )
    `);
    
    console.log('✅ Verifications table created successfully');
    
    // Create index for faster queries
    sqliteDb.run(`
      CREATE INDEX IF NOT EXISTS idx_verifications_status 
      ON verifications(status)
    `);
    
    sqliteDb.run(`
      CREATE INDEX IF NOT EXISTS idx_verifications_entity 
      ON verifications(entity_type, entity_id)
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
