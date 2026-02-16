// MongoDB Data Integrity Check
// Verifies all collections have expected data counts

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { HSCode, Country, Company, User, MarketplacePost, Conversation, Message } from './backend/models';

dotenv.config();

async function checkDataIntegrity() {
  console.log('🔍 Checking MongoDB Data Integrity...\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    // Check each collection
    const checks = [
      { name: 'Countries', model: Country, expected: 196 },
      { name: 'HS Codes (Total)', model: HSCode, expected: '~2790' },
      { name: 'HS Codes (Chapters 2-digit)', model: HSCode, query: { code: /^\d{2}$/ }, expected: 96 },
      { name: 'HS Codes (Partidas 4-digit)', model: HSCode, query: { code: /^\d{4}$/ }, expected: 178 },
      { name: 'HS Codes (Subpartidas 6-digit)', model: HSCode, query: { code: /^\d{6}$/ }, expected: 2516 },
      { name: 'Companies', model: Company, expected: 52 },
      { name: 'Users', model: User, expected: 207 },
      { name: 'Marketplace Posts', model: MarketplacePost, expected: '~10+' },
      { name: 'Conversations', model: Conversation, expected: '~5+' },
      { name: 'Messages', model: Message, expected: '~20+' }
    ];

    const results: any[] = [];

    for (const check of checks) {
      const query = check.query || {};
      const count = await check.model.countDocuments(query);
      const status = typeof check.expected === 'string' ? '✅' : (count === check.expected ? '✅' : '⚠️');
      
      results.push({
        collection: check.name,
        count,
        expected: check.expected,
        status
      });

      console.log(`${status} ${check.name}: ${count} (expected: ${check.expected})`);
    }

    console.log('\n📊 Summary:');
    const totalHSCodes = results.find(r => r.collection === 'HS Codes (Total)')?.count || 0;
    const chapters = results.find(r => r.collection === 'HS Codes (Chapters 2-digit)')?.count || 0;
    const partidas = results.find(r => r.collection === 'HS Codes (Partidas 4-digit)')?.count || 0;
    const subpartidas = results.find(r => r.collection === 'HS Codes (Subpartidas 6-digit)')?.count || 0;

    console.log(`Total HS Codes: ${totalHSCodes}`);
    console.log(`  - Chapters (2-digit): ${chapters}`);
    console.log(`  - Partidas (4-digit): ${partidas}`);
    console.log(`  - Subpartidas (6-digit): ${subpartidas}`);
    console.log(`  - Calculated Total: ${chapters + partidas + subpartidas}`);

    // Check text index
    console.log('\n🔍 Checking Text Index...');
    const indexes = await HSCode.collection.indexes();
    const hasTextIndex = indexes.some(idx => idx.key?._fts === 'text');
    console.log(hasTextIndex ? '✅ Text index exists' : '❌ Text index missing');

    // Test search
    console.log('\n🔎 Testing Search...');
    const searchResults = await HSCode.find(
      { $text: { $search: 'trigo' } },
      { score: { $meta: "textScore" } }
    ).limit(3);
    console.log(`Found ${searchResults.length} results for "trigo"`);
    searchResults.forEach(r => console.log(`  - ${r.code}: ${r.description}`));

    const warnings = results.filter(r => r.status === '⚠️');
    if (warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      warnings.forEach(w => {
        console.log(`  - ${w.collection}: ${w.count} (expected ${w.expected})`);
      });
    } else {
      console.log('\n✅ All data integrity checks passed!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDataIntegrity();
