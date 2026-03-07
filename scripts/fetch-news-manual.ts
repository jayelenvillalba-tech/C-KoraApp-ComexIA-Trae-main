import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Import NewsService after dotenv config
import('../backend/services/news-service.js').then(async ({ newsService }) => {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');
    console.log('Starting manual RSS fetch...\n');

    const result = await newsService.fetchAllSources();

    console.log('\n=== FETCH RESULTS ===');
    console.log(`✅ Added: ${result.added} new articles`);
    console.log(`⏭️  Skipped: ${result.skipped} duplicates`);
    console.log(`❌ Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
        console.log('\nError Details:');
        result.errors.forEach(err => console.log(`  - ${err}`));
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
}).catch(console.error);
