
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { HSCode } from './backend/models/HSCode';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkData() {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(MONGODB_URI!);
  }

  // Check for 2-digit codes (Chapters)
  const chapters = await HSCode.find({ code: { $regex: /^\d{2}$/ } }).limit(5);
  console.log(`Found ${chapters.length} potential chapters (2-digit):`);
  chapters.forEach(c => console.log(`- ${c.code}: ${c.description}`));

  // Check for 4-digit codes (Partidas)
  const partidas = await HSCode.find({ code: { $regex: /^\d{4}$/ } }).limit(5);
  console.log(`Found ${partidas.length} potential partidas (4-digit):`);
  partidas.forEach(p => console.log(`- ${p.code}: ${p.description}`));

  // Check total count
  const total = await HSCode.countDocuments();
  console.log(`Total documents: ${total}`);

  // Check unique chapter codes present in the collection if no chapter docs
  if (chapters.length === 0) {
    console.log('No chapter documents found. checking unique chapterCodes...');
    const distinctChapters = await HSCode.distinct('chapterCode');
    console.log(`Found ${distinctChapters.length} distinct chapter codes in data.`);
    console.log('Sample:', distinctChapters.slice(0, 5));
  }

  process.exit(0);
}

checkData();
