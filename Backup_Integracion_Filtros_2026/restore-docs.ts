
import Database from 'better-sqlite3';
import { join } from 'path';

const TARGET_DB = 'comexia_v2.db';
const SOURCE_DB = 'backups/backup-2026-01-22/database/comexia_v2.db';

console.log(`🚀 Iniciando restauración de documentos regulatorios...`);
console.log(`   Fuente: ${SOURCE_DB}`);
console.log(`   Destino: ${TARGET_DB}`);

try {
  const source = new Database(SOURCE_DB, { readonly: true });
  const target = new Database(TARGET_DB);

  // 1. Get data from source
  // Try regulatoryRules first (old table name)
  let rules = [];
  try {
     rules = source.prepare('SELECT * FROM regulatory_rules').all();
     console.log(`✅ Encontrados ${rules.length} registros en 'regulatory_rules' (backup)`);
  } catch (e) {
     console.log(`⚠️ 'regulatory_rules' no encontrada en backup. Probando 'country_requirements'...`);
     try {
       rules = source.prepare('SELECT * FROM country_requirements').all();
       console.log(`✅ Encontrados ${rules.length} registros en 'country_requirements' (backup)`);
     } catch (e2) {
       console.log(`❌ No se encontraron tablas de documentos en el backup.`);
       process.exit(1);
     }
  }

  // 2. Insert into target
  // Ensure target has regulatory_rules table
  try {
      // Check if table exists
      target.prepare('SELECT count(*) FROM regulatory_rules').get();
  } catch (e) {
      console.log(`⚠️ Tabla destino 'regulatory_rules' no existe? Verificando schema...`);
      // It should exist based on verify-data.ts output earlier.
  }

  const insert = target.prepare(`
    INSERT OR REPLACE INTO regulatory_rules (id, country_code, hs_chapter, title, description, category, url, required, created_at, updated_at)
    VALUES (@id, @countryCode, @hsChapter, @title, @description, @category, @url, @required, @createdAt, @updatedAt)
  `);

  const insertTransaction = target.transaction((data) => {
    let count = 0;
    for (const row of data) {
       // Map fields if necessary (snake_case to camelCase adapter might be needed if raw SQL vs ORM)
       // Better-sqlite3 returns row based on column names.
       // Assuming schema match. Let's inspect row structure first if needed.
       // If source is 'regulatory_rules', cols are snake_case: id, country_code ...
       // Drizzle schema maps them.
       
       const mappedRow = {
           id: row.id || row.ID,
           countryCode: row.country_code || row.countryCode,
           hsChapter: row.hs_chapter || row.hsChapter,
           title: row.title,
           description: row.description,
           category: row.category,
           url: row.url,
           required: row.required ? 1 : 0,
           createdAt: row.created_at || new Date().toISOString(),
           updatedAt: row.updated_at || new Date().toISOString()
       };

       insert.run(mappedRow);
       count++;
    }
    return count;
  });

  if (rules.length > 0) {
      const count = insertTransaction(rules);
      console.log(`🎉 Restaurados ${count} documentos exitosamente.`);
  }

  source.close();
  target.close();

} catch (error: any) {
  console.error(`❌ Error critico: ${error.message}`);
}
