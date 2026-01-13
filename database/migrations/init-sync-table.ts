import { db, sqliteDb } from '../db-sqlite.js';

async function migrate() {
    console.log('🔄 Creating sync_status table...');
    try {
        await sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS sync_status (
                hs_code TEXT PRIMARY KEY,
                last_sync INTEGER,
                status TEXT,
                error_message TEXT,
                created_at INTEGER
            );
        `);
        console.log('✅ Table sync_status created successfully');
    } catch (e) {
        console.error('❌ Error creating table:', e);
    }
    process.exit(0);
}

migrate();
