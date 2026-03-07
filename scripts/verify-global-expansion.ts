
import axios from 'axios';

async function verifyGlobal() {
    const baseUrl = 'http://localhost:3001/api/documents/required';
    
    console.log('--- Testing Europe (ARG -> DE Wine) ---');
    try {
        const res = await axios.get(`${baseUrl}?hsCode=220421&destinationCountry=DE&direction=import`);
        const docs = res.data.documents;
        const names = docs.map((d:any) => d.name);
        
        console.log('Germany Docs:', names);
        const hasVI1 = names.some((n:string) => n.includes('VI-1'));
        const hasGDPR = names.some((n:string) => n.includes('GDPR'));
        const hasEUDR = names.some((n:string) => n.includes('EUDR'));
        
        if (hasVI1 && hasGDPR) console.log('✅ Europe Wine Scenario PASS');
        else console.log('❌ Europe Wine Scenario FAIL');
    } catch(e) { console.error(e); }

    console.log('\n--- Testing Americas (ARG -> MX Meat) ---');
    try {
        const res = await axios.get(`${baseUrl}?hsCode=020130&destinationCountry=MX&direction=import`);
        const docs = res.data.documents;
        const names = docs.map((d:any) => d.name);
        
        console.log('Mexico Docs:', names);
        const hasZoo = names.some((n:string) => n.includes('Zoosanitario'));
        const hasUSMCA = names.some((n:string) => n.includes('USMCA'));
        
        if (hasZoo && hasUSMCA) console.log('✅ Americas Meat Scenario PASS');
        else console.log('❌ Americas Meat Scenario FAIL');
    } catch(e) { console.error(e); }
}

verifyGlobal();
