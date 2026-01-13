import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../shared/schema-sqlite.js';
import { config } from 'dotenv';

config();

// Exportable db instance (initially null)
export let db: any;
export let sqliteDb: any; 

export async function initDatabase() {
  // If db is already initialized, return it (Idempotent)
  if (db) return db;

  const isProduction = process.env.NODE_ENV === 'production';
  const useTurso = process.env.USE_TURSO === 'true' || (isProduction && process.env.TURSO_DATABASE_URL);

  if (useTurso) {
    if (!process.env.TURSO_DATABASE_URL) {
      throw new Error('TURSO_DATABASE_URL is missing for production');
    }

    console.log('🚀 Initializing Turso Database (LibSQL)...');
    try {
      const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      
      db = drizzle(client, { schema });
      
      // Monkey-patch sqliteDb for minor raw query compatibility if needed (best effort)
      sqliteDb = {
        exec: async (sql: string) => {
            console.warn('⚠️ WARNING: Using raw .exec() on Turso is not fully recommended for local patterns.');
            return await client.execute(sql);
        },
        prepare: () => { throw new Error('prepare() not supported on Turso client wrapper'); }
      };

      console.log('✅ Turso Database Connected');
    } catch (error: any) {
      console.error('❌ Failed to connect to Turso:', error.message);
      throw error;
    }
  } else {
    // Dynamic import for Local SQLite to avoid Vercel build/runtime errors
    console.log('💻 Initializing Local SQLite...');
    const dbSqlite = await import('./db-sqlite.js');
    await dbSqlite.initDatabase();
    db = dbSqlite.db;
    sqliteDb = dbSqlite.sqliteDb;
    console.log('✅ Local Database Ready');
  }
  
  return db;
}
