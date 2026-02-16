
import { initDatabase } from './database/db-sqlite.js';

async function test() {
    console.log('Calling initDatabase()...');
    try {
        const db = await initDatabase();
        console.log('✅ initDatabase() succeeded');
    } catch (e) {
        console.error('❌ initDatabase() failed:', e);
    }
}

test();
