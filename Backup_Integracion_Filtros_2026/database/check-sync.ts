import { db } from './db-sqlite.js';
import { syncStatus } from '../shared/schema-sqlite.js';
import { eq, sql } from 'drizzle-orm';

async function check() {
    const total = await db.select({ count: sql`count(*)` }).from(syncStatus);
    const pending = await db.select({ count: sql`count(*)` }).from(syncStatus).where(eq(syncStatus.status, 'pending'));
    const synced = await db.select({ count: sql`count(*)` }).from(syncStatus).where(eq(syncStatus.status, 'synced'));
    const failed = await db.select({ count: sql`count(*)` }).from(syncStatus).where(eq(syncStatus.status, 'failed'));

    console.log('--- SYNC STATUS ---');
    console.log(`Total: ${total[0].count}`);
    console.log(`Pending: ${pending[0].count}`);
    console.log(`Synced: ${synced[0].count}`);
    console.log(`Failed: ${failed[0].count}`);

    const failures = await db.select().from(syncStatus).where(eq(syncStatus.status, 'failed')).limit(3);
    if (failures.length > 0) {
        console.log('\nTop Failures:', failures);
    }
    
    process.exit(0);
}
check();
