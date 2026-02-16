// Find missing HS Codes between SQLite and MongoDB
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { initDatabase } from './database/db-sqlite';
import * as schema from './shared/schema-sqlite';
import { HSCode } from './backend/models/HSCode';

dotenv.config();

async function findMissingCodes() {
  console.log('🔍 Finding Missing HS Codes...\n');

  const db = await initDatabase();
  await mongoose.connect(process.env.MONGODB_URI!);

  // Get all codes from SQLite
  const sections = await db.select().from(schema.hsSections);
  const chapters = await db.select().from(schema.hsChapters);
  const partidas = await db.select().from(schema.hsPartidas);
  const subpartidas = await db.select().from(schema.hsSubpartidas);

  const sqliteCodes = new Set([
    ...sections.map(s => s.code),
    ...chapters.map(c => c.code),
    ...partidas.map(p => p.code),
    ...subpartidas.map(s => s.code)
  ]);

  console.log(`SQLite unique codes: ${sqliteCodes.size}`);

  // Get all codes from MongoDB
  const mongoCodes = await HSCode.find({}, { code: 1 });
  const mongoCodeSet = new Set(mongoCodes.map(m => m.code));

  console.log(`MongoDB codes: ${mongoCodeSet.size}`);

  // Find missing
  const missing: string[] = [];
  for (const code of sqliteCodes) {
    if (!mongoCodeSet.has(code)) {
      missing.push(code);
    }
  }

  console.log(`\nMissing codes: ${missing.length}`);
  if (missing.length > 0) {
    console.log('\nFirst 20 missing codes:');
    missing.slice(0, 20).forEach(code => {
      // Find in SQLite
      const section = sections.find(s => s.code === code);
      const chapter = chapters.find(c => c.code === code);
      const partida = partidas.find(p => p.code === code);
      const subpartida = subpartidas.find(s => s.code === code);
      
      const source = section || chapter || partida || subpartida;
      console.log(`  ${code}: ${source?.description || 'Unknown'}`);
    });
  }

  // Check for duplicates in SQLite
  const allSQLiteCodes = [
    ...sections.map(s => s.code),
    ...chapters.map(c => c.code),
    ...partidas.map(p => p.code),
    ...subpartidas.map(s => s.code)
  ];

  const duplicates = allSQLiteCodes.filter((code, index) => 
    allSQLiteCodes.indexOf(code) !== index
  );

  if (duplicates.length > 0) {
    console.log(`\n⚠️ Found ${duplicates.length} duplicate codes in SQLite:`);
    const uniqueDupes = [...new Set(duplicates)];
    uniqueDupes.slice(0, 10).forEach(code => console.log(`  ${code}`));
  }

  process.exit(0);
}

findMissingCodes();
