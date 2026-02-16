
import { db, initDatabase } from '../database/db-sqlite';
import { hsSubpartidas, hsChapters, hsPartidas } from '../shared/schema-sqlite';
import { like, or, eq } from 'drizzle-orm';

async function checkWine() {
    await initDatabase();
    console.log('🍷 Checking for "Vino" or "2204"...');

    // 1. Check Chapters
    const ch = await db.select().from(hsChapters).where(eq(hsChapters.code, '22'));
    console.log('Chapter 22:', ch.length > 0 ? 'Found' : 'MISSING');

    // 2. Check Partidas (Headings)
    const p = await db.select().from(hsPartidas).where(eq(hsPartidas.code, '2204'));
    console.log('Heading 2204:', p.length > 0 ? 'Found' : 'MISSING');

    // 3. Check Subpartidas (Subheadings) - Search Text
    const sub = await db.select().from(hsSubpartidas).where(
        or(
            like(hsSubpartidas.description, '%vino%'),
            like(hsSubpartidas.description, '%Vino%'),
            like(hsSubpartidas.code, '2204%')
        )
    );
    console.log(`Subheadings matching 'vino' or '2204': ${sub.length}`);
    sub.forEach(s => console.log(` - [${s.code}] ${s.description}`));
}

checkWine();
