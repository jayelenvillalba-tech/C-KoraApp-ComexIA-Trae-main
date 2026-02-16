
import { db } from './database/db-sqlite';
import { hsSubpartidas } from './shared/schema-sqlite';
import { like, or } from 'drizzle-orm';

async function search() {
  const query = 'carne';
  console.log(`Searching for: ${query}`);
  
  const results = await db.select()
    .from(hsSubpartidas)
    .where(
        or(
            like(hsSubpartidas.description, `%${query}%`),
            like(hsSubpartidas.descriptionEn, `%${query}%`)
        )
    )
    .limit(5);

  console.log('Results found:', results.length);
  results.forEach(r => console.log(`${r.code} - ${r.description} / ${r.descriptionEn}`));
}

search().catch(console.error);
