
import axios from 'axios';

async function testApi() {
    try {
        const url = 'http://localhost:3001/api/documents/required?hsCode=060311&destinationCountry=CL&direction=import';
        console.log(`Testing URL: ${url}`);
        
        const res = await axios.get(url);
        
        console.log('Status:', res.status);
        console.log('Source:', res.data.source);
        console.log('Total Docs:', res.data.total);
        
        const dbDocs = res.data.documents.filter((d: any) => d.source === 'database');
        console.log('Database Docs:', dbDocs.length);
        
        if (dbDocs.length > 0) {
            console.log('Sample DB Doc:', dbDocs[0].name);
        } else {
            console.warn('⚠️ No database documents found! Check migration/query logic.');
        }

    } catch (error: any) {
        console.error('API Error:', error.message);
    }
}

testApi();
