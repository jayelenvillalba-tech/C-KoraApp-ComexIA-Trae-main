import { initDatabase, db } from '../database/db-sqlite';
import { ExternalDataService } from '../backend/services/external-data';
import { marketData } from '../shared/schema-sqlite';
import { eq, like, and } from 'drizzle-orm';

async function verifyExternalData() {
  console.log('🧪 Starting ExternalDataService verification...');
  await initDatabase();

  const hsCode = '2805'; // Litio
  const origin = 'Argentina';

  console.log(`\n🔍 1. Fetching Trade Flows for HS ${hsCode} from ${origin} (Force Refresh)...`);
  try {
      const data = await ExternalDataService.getTradeFlows(hsCode, origin, true);
      console.log(`✅ Service returned ${data.length} records.`);
      console.log('Sample record:', data[0]);

      console.log('\n🔍 2. Verifying Persistence in DB...');
      const dbRecords = await db.select().from(marketData).where(like(marketData.hsCode, `${hsCode}%`));
      
      if (dbRecords.length > 0) {
          console.log(`✅ SUCCESS: Found ${dbRecords.length} records in 'market_data' table.`);
          console.log('First DB Record Source:', dbRecords[0].sourceApi);
      } else {
          console.error('❌ FAILURE: No records found in DB after ingestion.');
      }

  } catch (error) {
      console.error('❌ Error during verification:', error);
  }
}

verifyExternalData().catch(console.error);
