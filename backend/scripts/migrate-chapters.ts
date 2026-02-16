
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { initDatabase } from '../../database/db-sqlite';
import * as schema from '../../shared/schema-sqlite';
import { HSCode } from '../models/HSCode';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

function cleanData(obj: any) {
    const cleaned = { ...obj };
    // Safe date parsing
    const safeDate = (val: any) => {
        if (!val) return undefined;
        const d = new Date(val);
        return isNaN(d.getTime()) ? undefined : d;
    };
    if (cleaned.createdAt) cleaned.createdAt = safeDate(cleaned.createdAt) || new Date();
    if (cleaned.updatedAt) cleaned.updatedAt = safeDate(cleaned.updatedAt) || new Date();
    
    // Remove nulls
    Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === null) delete cleaned[key];
    });
    return cleaned;
}

async function migrateChapters() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not defined');
    process.exit(1);
  }

  try {
    console.log('🔄 Initializing SQLite...');
    const db = await initDatabase();
    if (!db) throw new Error('Failed to initialize SQLite');

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected');

    // 1. Migrate Chapters (2-digit)
    console.log('📖 Migrating Chapters...');
    const chaptersData = await db.select().from(schema.hsChapters);
    
    let chaptersCount = 0;
    for (const c of chaptersData) {
        // Check if exists
        const exists = await HSCode.findOne({ code: c.code });
        if (!exists) {
            await HSCode.create({
                code: c.code,
                description: c.description,
                descriptionEn: c.descriptionEn,
                chapterCode: c.code,
                partidaCode: '0000', // Placeholder
                sectionCode: c.sectionCode,
                notes: c.notes,
                notesEn: c.notesEn
            });
            chaptersCount++;
        }
    }
    console.log(`✅ Migrated ${chaptersCount} new Chapters`);

    // 2. Migrate Partidas (Headings, 4-digit)
    console.log('📑 Migrating Partidas (Headings)...');
    const partidasData = await db.select().from(schema.hsPartidas);
    
    let partidasCount = 0;
    for (const p of partidasData) {
        const exists = await HSCode.findOne({ code: p.code });
        if (!exists) {
            await HSCode.create({
                code: p.code,
                description: p.description,
                descriptionEn: p.descriptionEn,
                chapterCode: p.chapterCode,
                partidaCode: p.code, // It IS a partida
                tariffRate: p.tariffRate,
                units: p.units ? JSON.parse(p.units as string) : [],
                keywords: p.keywords ? p.keywords.split(',') : [],
                notes: p.notes,
                notesEn: p.notesEn
            });
            partidasCount++;
        }
    }
    console.log(`✅ Migrated ${partidasCount} new Partidas`);

    console.log('✅ Migration of hierarchical data completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

migrateChapters();
