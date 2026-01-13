import fetch from 'node-fetch';

async function testMarketAnalysis() {
  console.log('🧪 Testing Market Analysis Upgrade...\n');

  const testCases = [
    { hsCode: '0201', country: 'CN', operation: 'export', label: 'Carne Bovina → China' },
    { hsCode: '1201', country: 'US', operation: 'export', label: 'Soja → USA' },
    { hsCode: '2204', country: 'BR', operation: 'export', label: 'Vino → Brasil' },
  ];

  for (const test of testCases) {
    console.log(`\n📊 Testing: ${test.label}`);
    console.log(`   HS Code: ${test.hsCode} | Country: ${test.country}`);
    
    try {
      const url = `http://localhost:3000/api/market-analysis?hsCode=${test.hsCode}&country=${test.country}&operation=${test.operation}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        const { marketSize, overallScore, viability } = data.analysis;
        
        console.log(`   ✅ Market Size: $${marketSize.estimated}M USD`);
        console.log(`   📈 Trend: ${marketSize.trend} (${marketSize.growthRate}% CAGR)`);
        console.log(`   🎯 Confidence: ${marketSize.confidence}`);
        console.log(`   ⭐ Overall Score: ${overallScore}/100 (${viability})`);
      } else {
        console.log(`   ❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      console.log(`   ❌ Request Failed: ${error.message}`);
    }
  }

  console.log('\n✅ Test Complete!\n');
}

testMarketAnalysis();
