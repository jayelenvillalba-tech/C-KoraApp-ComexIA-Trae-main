
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { HSCode } from './backend/models/HSCode';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function debugSearch() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not defined');
    return;
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected');

    // 1. Check Indexes
    console.log('🔍 Checking Indexes...');
    const indexes = await HSCode.collection.indexes();
    console.log('Indexes:', JSON.stringify(indexes, null, 2));
    
    const hasTextIndex = indexes.some(idx => idx.key?._fts === 'text');
    if (!hasTextIndex) {
        console.warn('⚠️ Text index MISSING on HSCode collection!');
        console.log('🛠 Creating text index...');
        await HSCode.createIndexes();
        console.log('✅ Index created.');
    } else {
        console.log('✅ Text index exists.');
    }

    // 2. Test Search
    const term = 'trigo';
    console.log(`🔎 Searching for "${term}"...`);
    const results = await HSCode.find(
      { $text: { $search: term } },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .limit(5);

    console.log(`Found ${results.length} results:`);
    results.forEach(r => console.log(`- [${r.code}] ${r.description} (Score: ${r.score})`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugSearch();
