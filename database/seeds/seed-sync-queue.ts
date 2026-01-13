import { db } from '../db-sqlite.js';
import { marketData, syncStatus } from '../../shared/schema-sqlite.js';
import { sql } from 'drizzle-orm';

async function seedQueue() {
    console.log('🌱 Seeding Sync Queue...');
    
    // Get all distinct HS Codes currently in system
    const codes = await db.select({ 
        hs: sql`DISTINCT ${marketData.hsCode}` 
    }).from(marketData);
    
    console.log(`Found ${codes.length} distinct HS Codes.`);
    
    let added = 0;
    for (const c of codes) {
        try {
            await db.insert(syncStatus).values({
                hsCode: c.hs as string,
                status: 'pending'
            }).onConflictDoNothing(); // Skip if exists
            added++;
        } catch (e) {
            // ignore
        }
    }
    
    console.log(`✅ Queue seeded. Added ${added} new codes.`);
    process.exit(0);
}

seedQueue();
