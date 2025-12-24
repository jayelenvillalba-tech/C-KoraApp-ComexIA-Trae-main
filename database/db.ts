import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../shared/schema-sqlite.js';
import * as dbSqlite from './db-sqlite.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();

// Exportable db instance (will be populated by initDatabase)
export let db: any = dbSqlite.db;
export let sqliteDb: any = dbSqlite.sqliteDb; // For legacy raw access (Local only)

export async function initDatabase() {
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
    } catch (e: any) {
      console.error('❌ Failed to connect to Turso:', e.message);
      throw e;
    }
  } else {
    // Local Mode
    console.log('💻 Initializing Local SQLite...');
    await dbSqlite.initDatabase();
    db = dbSqlite.db;
    sqliteDb = dbSqlite.sqliteDb;
    console.log('✅ Local Database Ready');
  }

  return db;
}
