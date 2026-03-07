import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function testHSCodeAPI() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('✅ Connected to MongoDB\n');

        // Test 1: Check if HSCode collection exists
        const collections = await mongoose.connection.db.listCollections().toArray();
        const hsCodeCollection = collections.find(c => c.name === 'hscodes');
        console.log(`📦 HSCode Collection: ${hsCodeCollection ? '✅ Exists' : '❌ Missing'}`);

        if (!hsCodeCollection) {
            console.log('❌ CRITICAL: hscodes collection does not exist!');
            await mongoose.disconnect();
            return;
        }

        // Test 2: Count documents
        const count = await mongoose.connection.db.collection('hscodes').countDocuments();
        console.log(`📊 Total HS Codes: ${count}`);

        // Test 3: Check text index
        const indexes = await mongoose.connection.db.collection('hscodes').indexes();
        console.log(`\n🔍 Indexes on hscodes collection:`);
        indexes.forEach(idx => {
            console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
        });

        const hasTextIndex = indexes.some(idx => idx.key._fts === 'text');
        console.log(`\n📝 Text Index: ${hasTextIndex ? '✅ Present' : '❌ Missing'}`);

        // Test 4: Sample documents
        const samples = await mongoose.connection.db.collection('hscodes').find().limit(3).toArray();
        console.log(`\n📄 Sample Documents:`);
        samples.forEach(doc => {
            console.log(`  Code: ${doc.code}, Description: ${doc.description?.substring(0, 50)}...`);
        });

        // Test 5: Try text search
        if (hasTextIndex) {
            try {
                const searchResults = await mongoose.connection.db.collection('hscodes').find(
                    { $text: { $search: 'soja' } },
                    { projection: { score: { $meta: 'textScore' } } }
                ).limit(3).toArray();
                console.log(`\n🔎 Text Search Test (soja): ${searchResults.length} results`);
                searchResults.forEach(doc => {
                    console.log(`  Code: ${doc.code}, Score: ${doc.score}`);
                });
            } catch (error: any) {
                console.log(`\n❌ Text Search Failed: ${error.message}`);
            }
        }

        // Test 6: Check schema fields
        const sampleDoc = samples[0];
        console.log(`\n🏗️  Document Structure:`);
        console.log(`  Fields: ${Object.keys(sampleDoc).join(', ')}`);

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

testHSCodeAPI();
