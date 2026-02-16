import { db } from '../../database/db-sqlite.js';
import { marketData, syncStatus } from '../../shared/schema-sqlite.js';
import { eq, sql } from 'drizzle-orm';
import { ComtradeService } from './comtrade-service.js';

// Configuration
const DELAY_MS = 15000; // 15 seconds between products
const COUNTRY_DELAY_MS = 5000; // 5 seconds between countries

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runWorker() {
    console.log('🚀 Starting Comtrade Sync Worker...');
    console.log(`🔑 key: ${process.env.COMTRADE_API_KEY ? 'Present' : 'MISSING'}`);
    console.log(`⏱️  Delay: ${DELAY_MS}ms `);

    let errors = 0;

    while (true) {
        // 1. Get next pending task
        const task = await db.select().from(syncStatus)
            .where(eq(syncStatus.status, 'pending'))
            .limit(1);

        if (task.length === 0) {
            console.log('✅ All tasks completed. Checking again in 1 minute...');
            await sleep(60000);
            continue;
        }

        const { hsCode } = task[0];
        console.log(`🔄 [${new Date().toISOString()}] Processing HS: ${hsCode}...`);

        try {
            // 2. Fetch Data for Top Economies
            // We fetch "Imports" (Demand) for these countries to populate Market Size
            const countries = ['CN', 'US', 'BR', 'DE', 'IN']; // China, USA, Brazil, Germany, India
            
            for (const c of countries) {
                 process.stdout.write(`   > Fetching ${c}... `);
                 await ComtradeService.getImportData(hsCode, c); 
                 console.log('Done.');
                 await sleep(COUNTRY_DELAY_MS);
            }

            // 3. Mark as Synced
            await db.update(syncStatus)
                .set({ status: 'synced', lastSync: new Date() })
                .where(eq(syncStatus.hsCode, hsCode));
            
            console.log(`✅ Successfully Synced HS: ${hsCode}`);
            errors = 0;

        } catch (e: any) {
            console.error(`\n❌ Failed HS: ${hsCode}`, e.message);
            await db.update(syncStatus)
                .set({ status: 'failed', errorMessage: e.message?.substring(0, 255) || 'Unknown error' })
                .where(eq(syncStatus.hsCode, hsCode));
                
            errors++;
            if (errors > 5) {
                console.log('⚠️ Too many consecutive errors. Sleeping 5 mins to cool down...');
                await sleep(300000);
                errors = 0;
            }
        }

        console.log(`💤 Sleeping ${DELAY_MS}ms...`);
        await sleep(DELAY_MS);
    }
}

runWorker();
