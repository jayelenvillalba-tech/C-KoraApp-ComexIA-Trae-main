import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function fullAudit() {
    console.log('='.repeat(70));
    console.log('COMEXIA FULL MONGODB AUDIT');
    console.log('='.repeat(70));

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.log('ERROR: MONGODB_URI not found in .env');
        process.exit(1);
    }
    console.log(`\nMONGODB_URI: ${uri.substring(0, 40)}...`);

    try {
        await mongoose.connect(uri);
        console.log('\n✅ CONNECTED to MongoDB Atlas\n');
        
        const db = mongoose.connection.db;
        
        // List all collections
        const collections = await db.listCollections().toArray();
        console.log(`Total Collections: ${collections.length}\n`);
        
        console.log('-'.repeat(70));
        console.log('COLLECTION STATS:');
        console.log('-'.repeat(70));
        
        const results: any[] = [];
        
        for (const col of collections) {
            const name = col.name;
            const count = await db.collection(name).countDocuments();
            
            // Get most recent document
            let latestDate = 'N/A';
            try {
                const latest = await db.collection(name).findOne({}, { sort: { createdAt: -1 } });
                if (latest?.createdAt) {
                    latestDate = new Date(latest.createdAt).toISOString().split('T')[0];
                } else if (latest?._id) {
                    // Extract date from ObjectId
                    const ts = Math.floor(parseInt(latest._id.toString().substring(0, 8), 16)) * 1000;
                    latestDate = new Date(ts).toISOString().split('T')[0];
                }
            } catch {}
            
            // Sample data check
            let sample = 'N/A';
            try {
                const doc = await db.collection(name).findOne({});
                if (doc) {
                    const keys = Object.keys(doc).filter(k => k !== '_id' && k !== '__v');
                    sample = keys.slice(0, 4).join(', ');
                }
            } catch {}
            
            results.push({ name, count, latestDate });
            console.log(`${name.padEnd(30)} | ${String(count).padStart(8)} docs | Latest: ${latestDate}`);
        }
        
        console.log('\n' + '='.repeat(70));
        console.log('CRITICAL DATA CHECKS:');
        console.log('='.repeat(70));
        
        // HS Codes check
        const hsCount = await db.collection('hscodes').countDocuments();
        const soja = await db.collection('hscodes').findOne({ $or: [
            { description: /soja/i }, { descriptionEn: /soybean/i }
        ]});
        const trigo = await db.collection('hscodes').findOne({ $or: [
            { description: /trigo/i }, { descriptionEn: /wheat/i }
        ]});
        
        console.log(`\nHSCode check (${hsCount} total):`);
        console.log(`  Soja/Soybean: ${soja ? `✅ Code ${soja.code} - ${soja.description}` : '❌ NOT FOUND'}`);
        console.log(`  Trigo/Wheat:  ${trigo ? `✅ Code ${trigo.code} - ${trigo.description}` : '❌ NOT FOUND'}`);
        
        // Text index check
        const hsIndexes = await db.collection('hscodes').indexes();
        const hasTextIdx = hsIndexes.some((idx: any) => idx.key?._fts === 'text');
        console.log(`  Text Index:  ${hasTextIdx ? '✅ Present' : '❌ MISSING - CAUSES SEARCH 500 ERROR'}`);
        
        // Countries check
        const arCountry = await db.collection('countries').findOne({ code: 'AR' });
        const ngCountry = await db.collection('countries').findOne({ code: 'NG' });
        console.log(`\nCountries:`);
        console.log(`  AR (Argentina): ${arCountry ? '✅' : '❌'}`);
        console.log(`  NG (Nigeria):   ${ngCountry ? '✅' : '❌'}`);
        
        // Regulations check
        const afcfta = await db.collection('regulations').findOne({ name: /AfCFTA/i });
        const reach = await db.collection('regulations').findOne({ name: /REACH/i });
        const usmca = await db.collection('regulations').findOne({ name: /USMCA/i });
        console.log(`\nRegulations:`);
        console.log(`  AfCFTA: ${afcfta ? '✅' : '❌ MISSING'}`);
        console.log(`  REACH:  ${reach ? '✅' : '❌ MISSING'}`);
        console.log(`  USMCA:  ${usmca ? '✅' : '❌ MISSING'}`);
        
        // Text search test
        console.log('\n' + '='.repeat(70));
        console.log('TEXT SEARCH TEST (simulating frontend query):');
        console.log('='.repeat(70));
        
        if (hasTextIdx) {
            try {
                const sojaResults = await db.collection('hscodes').find(
                    { $text: { $search: 'soja' } },
                    { projection: { score: { $meta: 'textScore' }, code: 1, description: 1 } }
                ).sort({ score: { $meta: 'textScore' } }).limit(3).toArray();
                console.log(`\n  search("soja"): ${sojaResults.length} results`);
                sojaResults.forEach((r: any) => console.log(`    - ${r.code}: ${r.description}`));
                
                const trigoResults = await db.collection('hscodes').find(
                    { $text: { $search: 'trigo' } },
                    { projection: { score: { $meta: 'textScore' }, code: 1, description: 1 } }
                ).sort({ score: { $meta: 'textScore' } }).limit(3).toArray();
                console.log(`  search("trigo"): ${trigoResults.length} results`);
                trigoResults.forEach((r: any) => console.log(`    - ${r.code}: ${r.description}`));
            } catch (e: any) {
                console.log(`  ❌ Text search FAILED: ${e.message}`);
            }
        } else {
            console.log('  ❌ Cannot test - no text index');
        }
        
        await mongoose.disconnect();
        console.log('\n✅ AUDIT COMPLETE\n');
        
    } catch (e: any) {
        console.error(`\n❌ CONNECTION FAILED: ${e.message}`);
    }
}

fullAudit();
