
import { initDatabase } from '../database/db-sqlite';
import { handleCountryRecommendations } from '../backend/routes/country-recommendations';

async function testApiResponse() {
    await initDatabase();
    
    console.log('🔍 Testing API Response for Habas de soja (HS 1201)\n');
    
    // Mock Express Request/Response
    const mockReq: any = {
        query: {
            hsCode: '1201',
            originCountry: 'AR'
        }
    };
    
    let responseData: any = null;
    const mockRes: any = {
        json: (data: any) => {
            responseData = data;
            console.log('📦 API Response:\n');
            console.log(JSON.stringify(data, null, 2));
        },
        status: (code: number) => {
            console.error(`❌ Status ${code}`);
            return mockRes;
        }
    };
    
    await handleCountryRecommendations(mockReq, mockRes);
    
    if (responseData) {
        console.log('\n📊 Data Summary:');
        console.log(`   - topBuyers: ${responseData.topBuyers?.length || 0}`);
        console.log(`   - treatyRecommendations: ${responseData.treatyRecommendations?.length || 0}`);
        console.log(`   - cheComexRecommended: ${responseData.cheComexRecommended?.length || 0}`);
        
        if (responseData.treatyRecommendations && responseData.treatyRecommendations.length > 0) {
            console.log('\n📜 Treaty Recommendations Detail:');
            responseData.treatyRecommendations.forEach((t: any, i: number) => {
                console.log(`   ${i + 1}. ${t.country} (${t.countryCode})`);
                console.log(`      Treaty: ${t.treaty}`);
                console.log(`      Tariff: ${t.tariff}%`);
                console.log(`      Coords: ${JSON.stringify(t.coordinates)}`);
            });
        } else {
            console.log('\n⚠️  NO TREATY RECOMMENDATIONS RETURNED!');
        }
    }
}

testApiResponse().catch(console.error);
