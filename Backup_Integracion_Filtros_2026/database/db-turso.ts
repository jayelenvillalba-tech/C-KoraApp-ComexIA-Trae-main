import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../shared/schema-sqlite.js';
import { config } from 'dotenv';

config();

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoToken) {
  throw new Error('Missing Turso credentials. Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env');
}

console.log(`📡 Connecting to Turso database at: ${tursoUrl}`);

// Create Turso client
const client = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

// Create Drizzle instance
export const db = drizzle(client, { schema });

// Simple test function
export async function testConnection() {
  try {
    const result = await client.execute('SELECT 1 as test');
    console.log('✅ Connected to Turso database successfully');
    return true;
  } catch (error) {
    console.error('❌ Turso connection error:', error);
    return false;
  }
}

// Export client for direct queries if needed
export { client };
