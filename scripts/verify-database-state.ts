import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function verifyDatabaseState() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('✅ Connected to MongoDB Atlas\n');
        console.log('=' .repeat(60));
        console.log('DATABASE STATE VERIFICATION');
        console.log('='.repeat(60));

        // Get all collection names
        const collections = await mongoose.connection.db.listCollections().toArray();
        
        console.log('\n📊 COLLECTIONS STATUS:\n');
        
        for (const collection of collections) {
            const count = await mongoose.connection.db.collection(collection.name).countDocuments();
            console.log(`  ${collection.name.padEnd(30)} ${count.toString().padStart(10)} documents`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('CRITICAL COLLECTIONS VERIFICATION');
        console.log('='.repeat(60) + '\n');

        // Verify critical data
        const countriesCount = await mongoose.connection.db.collection('countries').countDocuments();
        const hsCodesCount = await mongoose.connection.db.collection('hscodes').countDocuments();
        const regulationsCount = await mongoose.connection.db.collection('regulations').countDocuments();
        const usersCount = await mongoose.connection.db.collection('users').countDocuments();
        const postsCount = await mongoose.connection.db.collection('marketplaceposts').countDocuments();
        const newsCount = await mongoose.connection.db.collection('newsitems').countDocuments();

        const status = {
            countries: { count: countriesCount, expected: 193, status: countriesCount === 193 ? '✅' : '⚠️' },
            hsCodes: { count: hsCodesCount, expected: '8000+', status: hsCodesCount >= 8000 ? '✅' : '⚠️' },
            regulations: { count: regulationsCount, expected: '100+', status: regulationsCount >= 100 ? '✅' : '⚠️' },
            users: { count: usersCount, expected: '200+', status: usersCount >= 200 ? '✅' : '⚠️' },
            posts: { count: postsCount, expected: '200+', status: postsCount >= 200 ? '✅' : '⚠️' },
            news: { count: newsCount, expected: '5+', status: newsCount >= 5 ? '✅' : '⚠️' }
        };

        console.log(`${status.countries.status} Countries:     ${status.countries.count} / ${status.countries.expected}`);
        console.log(`${status.hsCodes.status} HS Codes:      ${status.hsCodes.count} / ${status.hsCodes.expected}`);
        console.log(`${status.regulations.status} Regulations:   ${status.regulations.count} / ${status.regulations.expected}`);
        console.log(`${status.users.status} Users:         ${status.users.count} / ${status.users.expected}`);
        console.log(`${status.posts.status} Posts:         ${status.posts.count} / ${status.posts.expected}`);
        console.log(`${status.news.status} News Items:    ${status.news.count} / ${status.news.expected}`);

        console.log('\n' + '='.repeat(60));
        console.log('SAMPLE DATA VERIFICATION');
        console.log('='.repeat(60) + '\n');

        // Test HS Code search
        const soyaCode = await mongoose.connection.db.collection('hscodes').findOne({ code: '1201' });
        console.log(`🔍 HS Code 1201 (Soya): ${soyaCode ? '✅ Found' : '❌ Missing'}`);

        const wheatCode = await mongoose.connection.db.collection('hscodes').findOne({ code: '1001' });
        console.log(`🔍 HS Code 1001 (Wheat): ${wheatCode ? '✅ Found' : '❌ Missing'}`);

        const wineCode = await mongoose.connection.db.collection('hscodes').findOne({ code: '2204' });
        console.log(`🔍 HS Code 2204 (Wine): ${wineCode ? '✅ Found' : '❌ Missing'}`);

        // Test countries
        const argentina = await mongoose.connection.db.collection('countries').findOne({ code: 'AR' });
        console.log(`🌍 Country AR (Argentina): ${argentina ? '✅ Found' : '❌ Missing'}`);

        const nigeria = await mongoose.connection.db.collection('countries').findOne({ code: 'NG' });
        console.log(`🌍 Country NG (Nigeria): ${nigeria ? '✅ Found' : '❌ Missing'}`);

        // Test regulations
        const afcfta = await mongoose.connection.db.collection('regulations').findOne({ name: /AfCFTA/i });
        console.log(`📜 AfCFTA Regulation: ${afcfta ? '✅ Found' : '❌ Missing'}`);

        const reach = await mongoose.connection.db.collection('regulations').findOne({ name: /REACH/i });
        console.log(`📜 REACH Regulation: ${reach ? '✅ Found' : '❌ Missing'}`);

        console.log('\n' + '='.repeat(60));
        console.log('OVERALL STATUS');
        console.log('='.repeat(60) + '\n');

        const allGood = Object.values(status).every(s => s.status === '✅');
        if (allGood) {
            console.log('✅ ALL CRITICAL DATA PRESENT - DATABASE STABLE');
        } else {
            console.log('⚠️  SOME DATA MISSING - RESTORATION MAY BE NEEDED');
        }

        console.log('\n');
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB\n');

    } catch (error) {
        console.error('❌ Error verifying database:', error);
        process.exit(1);
    }
}

verifyDatabaseState();
