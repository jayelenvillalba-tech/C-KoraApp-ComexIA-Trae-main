import { db, initDatabase } from '../database/db-sqlite';
import { sql } from 'drizzle-orm';
import Database from 'better-sqlite3';
import path from 'path';

async function migrateSchema() {
  console.log('🔄 Starting manual schema migration...');
  
  const dbPath = process.env.SQLITE_DB_PATH || path.resolve(process.cwd(), 'comexia_v2.db');
  const sqlite = new Database(dbPath);

  try {
    console.log('Adding column last_updated_at...');
    try {
        sqlite.exec('ALTER TABLE market_data ADD COLUMN last_updated_at INTEGER');
        console.log('✅ Added last_updated_at');
    } catch (e: any) {
        if (e.message.includes('duplicate column')) {
            console.log('⚠️  Column last_updated_at already exists');
        } else {
            throw e;
        }
    }

    console.log('Adding column source_api...');
    try {
        sqlite.exec('ALTER TABLE market_data ADD COLUMN source_api TEXT DEFAULT "manual"');
        console.log('✅ Added source_api');
    } catch (e: any) {
        if (e.message.includes('duplicate column')) {
             console.log('⚠️  Column source_api already exists');
        } else {
            throw e;
        }
    }
    
    console.log('✅ Migration successful');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    sqlite.close();
  }
}

migrateSchema();
