// Check HS Code counts in both SQLite and MongoDB
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { initDatabase } from './database/db-sqlite';
import * as schema from './shared/schema-sqlite';
import { HSCode } from './backend/models/HSCode';

dotenv.config();

async function investigateHSCodes() {
  console.log('🔍 Investigating HS Code Data Sources...\n');

  // 1. Check SQLite
  console.log('📊 SQLite Database:');
  const db = await initDatabase();
  
  const sections = await db.select().from(schema.hsSections);
  const chapters = await db.select().from(schema.hsChapters);
  const partidas = await db.select().from(schema.hsPartidas);
  const subpartidas = await db.select().from(schema.hsSubpartidas);
  
  console.log(`  Sections: ${sections.length}`);
  console.log(`  Chapters: ${chapters.length}`);
  console.log(`  Partidas: ${partidas.length}`);
  console.log(`  Subpartidas: ${subpartidas.length}`);
  console.log(`  TOTAL: ${sections.length + chapters.length + partidas.length + subpartidas.length}`);

  // 2. Check MongoDB
  console.log('\n📊 MongoDB Atlas:');
  await mongoose.connect(process.env.MONGODB_URI!);
  
  const totalMongo = await HSCode.countDocuments();
  const chapters2digit = await HSCode.countDocuments({ code: /^\d{2}$/ });
  const partidas4digit = await HSCode.countDocuments({ code: /^\d{4}$/ });
  const subpartidas6digit = await HSCode.countDocuments({ code: /^\d{6}$/ });
  const subpartidas8digit = await HSCode.countDocuments({ code: /^\d{8}$/ });
  const subpartidas10digit = await HSCode.countDocuments({ code: /^\d{10}$/ });
  
  console.log(`  Total documents: ${totalMongo}`);
  console.log(`  Chapters (2-digit): ${chapters2digit}`);
  console.log(`  Partidas (4-digit): ${partidas4digit}`);
  console.log(`  Subpartidas (6-digit): ${subpartidas6digit}`);
  console.log(`  Subpartidas (8-digit): ${subpartidas8digit}`);
  console.log(`  Subpartidas (10-digit): ${subpartidas10digit}`);

  // 3. Comparison
  console.log('\n📉 Missing Data:');
  const expectedTotal = chapters.length + partidas.length + subpartidas.length;
  const missing = expectedTotal - totalMongo;
  console.log(`  Expected from SQLite: ${expectedTotal}`);
  console.log(`  Current in MongoDB: ${totalMongo}`);
  console.log(`  Missing: ${missing} documents`);

  // 4. Sample data
  console.log('\n📋 Sample SQLite Subpartidas (first 5):');
  subpartidas.slice(0, 5).forEach(s => {
    console.log(`  ${s.code}: ${s.description}`);
  });

  console.log('\n📋 Sample MongoDB HSCodes (first 5 6-digit):');
  const mongoSamples = await HSCode.find({ code: /^\d{6}$/ }).limit(5);
  mongoSamples.forEach(m => {
    console.log(`  ${m.code}: ${m.description}`);
  });

  // 5. Check if 8-digit or 10-digit codes exist in SQLite
  console.log('\n🔍 Checking for extended codes in SQLite...');
  const sample8digit = subpartidas.filter(s => s.code.length === 8).slice(0, 3);
  const sample10digit = subpartidas.filter(s => s.code.length === 10).slice(0, 3);
  console.log(`  8-digit codes in SQLite: ${subpartidas.filter(s => s.code.length === 8).length}`);
  console.log(`  10-digit codes in SQLite: ${subpartidas.filter(s => s.code.length === 10).length}`);
  
  if (sample8digit.length > 0) {
    console.log('  Sample 8-digit:');
    sample8digit.forEach(s => console.log(`    ${s.code}: ${s.description}`));
  }

  process.exit(0);
}

investigateHSCodes().catch(console.error);
