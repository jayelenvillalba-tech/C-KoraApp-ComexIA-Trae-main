
import axios from 'axios';

async function verifyScenario() {
    const url = 'http://localhost:3001/api/documents/required?hsCode=100119&destinationCountry=NG&direction=export'; // Export from somewhere to Nigeria
    console.log(`Checking: ${url}`);
    
    try {
        const res = await axios.get(url);
        const docs = res.data.documents;
        
        console.log(`Total Docs: ${docs.length}`);
        
        // Check for specific Africa docs
        const hasFormM = docs.some((d:any) => d.name.includes('Form M'));
        const hasPhyto = docs.some((d:any) => d.name.includes('Phytosanitary'));
        const hasNafdac = docs.some((d:any) => d.description.includes('NAFDAC'));
        
        console.log('Has Form M:', hasFormM);
        console.log('Has Phytosanitary:', hasPhyto);
        console.log('Has NAFDAC mention:', hasNafdac);
        
        if (hasFormM && hasPhyto) {
            console.log('✅ Nigeria Wheat Scenario PASS');
        } else {
            console.log('❌ Nigeria Wheat Scenario FAIL');
            console.log('Docs found:', docs.map((d:any) => d.name));
        }
        
    } catch (e) {
        console.error(e);
    }
}

verifyScenario();
