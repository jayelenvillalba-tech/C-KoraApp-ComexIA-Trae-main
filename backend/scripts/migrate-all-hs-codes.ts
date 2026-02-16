// Complete HS Code Migration with Upsert Strategy
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { initDatabase } from '../../database/db-sqlite';
import * as schema from '../../shared/schema-sqlite';
import { HSCode } from '../models/HSCode';

dotenv.config();

function cleanData(obj: any) {
    const cleaned = { ...obj };
    Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === null) delete cleaned[key];
    });
    return cleaned;
}

async function migrateAllHSCodesUpsert() {
  console.log('🔄 Migrating ALL HS Code Levels (Upsert Mode)...\n');

  try {
    const db = await initDatabase();
    await mongoose.connect(process.env.MONGODB_URI!);

    let totalMigrated = 0;
    const operations: any[] = [];

    // 1. Prepare Sections
    console.log('📚 Preparing Sections...');
    const sections = await db.select().from(schema.hsSections);
    for (const section of sections) {
      operations.push({
        updateOne: {
          filter: { code: section.code },
          update: {
            $set: {
              code: section.code,
              description: section.description,
              descriptionEn: section.descriptionEn,
              chapterCode: section.code,
              partidaCode: '0000',
              sectionCode: section.code,
              notes: `Chapters: ${section.chapterRange}`
            }
          },
          upsert: true
        }
      });
    }
    console.log(`✅ Prepared ${sections.length} sections`);

    // 2. Prepare Chapters
    console.log('📖 Preparing Chapters...');
    const chapters = await db.select().from(schema.hsChapters);
    for (const chapter of chapters) {
      operations.push({
        updateOne: {
          filter: { code: chapter.code },
          update: {
            $set: {
              code: chapter.code,
              description: chapter.description,
              descriptionEn: chapter.descriptionEn,
              chapterCode: chapter.code,
              partidaCode: '0000',
              sectionCode: chapter.sectionCode,
              notes: chapter.notes,
              notesEn: chapter.notesEn
            }
          },
          upsert: true
        }
      });
    }
    console.log(`✅ Prepared ${chapters.length} chapters`);

    // 3. Prepare Partidas
    console.log('📑 Preparing Partidas...');
    const partidas = await db.select().from(schema.hsPartidas);
    for (const partida of partidas) {
      operations.push({
        updateOne: {
          filter: { code: partida.code },
          update: {
            $set: {
              code: partida.code,
              description: partida.description,
              descriptionEn: partida.descriptionEn,
              chapterCode: partida.chapterCode,
              partidaCode: partida.code,
              tariffRate: partida.tariffRate,
              units: partida.units ? (typeof partida.units === 'string' ? JSON.parse(partida.units) : partida.units) : [],
              keywords: partida.keywords ? (typeof partida.keywords === 'string' ? partida.keywords.split(',') : partida.keywords) : [],
              notes: partida.notes,
              notesEn: partida.notesEn
            }
          },
          upsert: true
        }
      });
    }
    console.log(`✅ Prepared ${partidas.length} partidas`);

    // 4. Prepare Subpartidas
    console.log('📋 Preparing Subpartidas...');
    const subpartidas = await db.select().from(schema.hsSubpartidas);
    for (const sub of subpartidas) {
      operations.push({
        updateOne: {
          filter: { code: sub.code },
          update: {
            $set: {
              code: sub.code,
              description: sub.description,
              descriptionEn: sub.descriptionEn,
              chapterCode: sub.chapterCode,
              partidaCode: sub.partidaCode,
              tariffRate: sub.tariffRate,
              specialTariffRate: sub.specialTariffRate,
              units: sub.units ? (typeof sub.units === 'string' ? JSON.parse(sub.units) : sub.units) : [],
              restrictions: sub.restrictions ? (typeof sub.restrictions === 'string' ? JSON.parse(sub.restrictions) : sub.restrictions) : [],
              keywords: sub.keywords ? (typeof sub.keywords === 'string' ? sub.keywords.split(',') : sub.keywords) : [],
              notes: sub.notes,
              notesEn: sub.notesEn,
              isActive: sub.isActive !== undefined ? Boolean(sub.isActive) : true
            }
          },
          upsert: true
        }
      });
    }
    console.log(`✅ Prepared ${subpartidas.length} subpartidas`);

    // Execute bulk write
    console.log(`\n💾 Executing bulk upsert (${operations.length} operations)...`);
    const result = await HSCode.bulkWrite(operations, { ordered: false });
    
    console.log('\n📊 Bulk Write Results:');
    console.log(`  Inserted: ${result.insertedCount}`);
    console.log(`  Modified: ${result.modifiedCount}`);
    console.log(`  Upserted: ${result.upsertedCount}`);

    // Verify final count
    const finalCount = await HSCode.countDocuments();
    const expectedTotal = sections.length + chapters.length + partidas.length + subpartidas.length;
    
    console.log('\n📊 Migration Summary:');
    console.log(`  Sections: ${sections.length}`);
    console.log(`  Chapters: ${chapters.length}`);
    console.log(`  Partidas: ${partidas.length}`);
    console.log(`  Subpartidas: ${subpartidas.length}`);
    console.log(`  Expected Total: ${expectedTotal}`);
    console.log(`  Final Count in MongoDB: ${finalCount}`);

    if (finalCount >= expectedTotal) {
      console.log('\n✅ All HS Codes migrated successfully!');
    } else {
      console.warn(`\n⚠️ Warning: Expected ${expectedTotal}, got ${finalCount}`);
    }

    // Test search
    console.log('\n🔎 Testing search...');
    const trigoResults = await HSCode.find(
      { $text: { $search: 'trigo' } },
      { score: { $meta: "textScore" } }
    ).limit(3);
    console.log(`Found ${trigoResults.length} results for "trigo":`);
    trigoResults.forEach(r => console.log(`  ${r.code}: ${r.description}`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

migrateAllHSCodesUpsert();
