
import { initDatabase } from '../database/db-sqlite';
import { OpportunityEngineService } from '../backend/services/opportunity-engine';

async function verifyEngine() {
  console.log('🧠 Testing Automated Opportunity Engine...');
  await initDatabase();

  const testInputs = [
      { term: 'Vino', origin: 'Argentina' },
      { term: 'Litio', origin: 'Argentina' },
      { term: 'Smartphone', origin: 'China' } // Should map to 8517/8542
  ];

  for (const input of testInputs) {
      console.log(`\n-----------------------------------`);
      console.log(`🔎 Analysis Request: "${input.term}" from ${input.origin}`);
      
      try {
          const results = await OpportunityEngineService.analyzeOpportunity(input.term, input.origin);
          
          if (results.length === 0) {
              console.log('⚠️  No candidates found (Data might be missing for this HS).');
              continue;
          }

          console.log(`✅ Found ${results.length} Opportunity Candidates. Top 3:`);
          
          results.slice(0, 3).forEach(op => {
              console.log(`   #${op.rank} 🏳️‍🌈 ${op.country} (Score: ${op.score})`);
              console.log(`      📊 Demand: ${op.details.demandScore} | 🛡️ Tariff: ${op.details.tariffScore} (${op.regulations.tariff.rate}%) | 📝 Ease: ${op.details.easeScore}`);
              console.log(`      💰 Est. Landed Cost: $${op.details.landedCost} (FOB: $${op.marketData.price})`);
              console.log(`      ⚖️  Regulation: ${op.regulations.tariff.agreement || 'MFN'}`);
          });

      } catch (err: any) {
          console.error('❌ Engine Error:', err.message);
      }
  }
}

verifyEngine().catch(console.error);
