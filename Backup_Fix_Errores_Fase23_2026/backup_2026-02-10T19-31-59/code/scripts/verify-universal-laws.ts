
import { initDatabase } from '../database/db-sqlite';
import { RegulatoryDataService } from '../backend/services/regulatory-data';

async function verifyUniversalLaws() {
  console.log('⚖️  Starting Universal Regulatory Intelligence Verification...');
  await initDatabase();

  const testCases = [
      { hs: '300490', text: 'Medicamentos (Pharma)', dest: 'DE' }, // Germany
      { hs: '020230', text: 'Carne Bovina', dest: 'CN' }, // China
      { hs: '851762', text: 'Smartphones (Tech)', dest: 'US' } // USA
  ];

  for (const test of testCases) {
      console.log(`\n🔍 Testing: ${test.text} [${test.hs}] -> ${test.dest}`);
      try {
          const laws = await RegulatoryDataService.getRequirements(test.hs, test.dest);
          
          console.log(`   ✅ Rules Engine Result:`);
          console.log(`      - Tariff: ${laws.tariff.rate}% (${laws.tariff.agreement || laws.tariff.type})`);
          console.log(`      - Documents: ${laws.documents.length} required`);
          laws.documents.forEach(d => console.log(`        • [${d.type}] ${d.name} (${d.importance})`));
          
          if (laws.nonTariffMeasures.length > 0) {
              console.log(`      - NTMs: ${laws.nonTariffMeasures.join(', ')}`);
          }
           if (laws.restrictions.length > 0) {
              console.log(`      - Restrictions: ${laws.restrictions.join(', ')}`);
          }

      } catch (err: any) {
          console.error(`   ❌ Failed to fetch laws:`, err.message);
      }
  }
}

verifyUniversalLaws().catch(console.error);
