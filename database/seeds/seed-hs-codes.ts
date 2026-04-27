
import { initDatabase, saveDatabase, getSqliteDb } from '../db-sqlite.js';
import { HS_CODES_DATABASE } from '../../shared/hs-codes-database.js';
import crypto from 'crypto';

console.log('=== INICIO DEL SCRIPT DE SEMILLAS DE CÓDIGOS HS ===');

async function main() {
  try {
    await initDatabase();
    const sqliteDb = getSqliteDb();
    console.log(`📊 Total de códigos HS en base de datos estática: ${HS_CODES_DATABASE.length}`);

    // Tables are now initialized centrally by database/init-db.ts
    console.log('📦 Seeding HS Sections, Chapters, Partidas and Subpartidas...');

    // 1. Insertar Secciones si no existen
    console.log('1. Insertando secciones...');
    const sections = [
      { id: '1', code: 'I', number: 1, description: 'Animales vivos y productos del reino animal', descriptionEn: 'Live animals; animal products', chapterRange: '01-05' },
      { id: '2', code: 'II', number: 2, description: 'Productos del reino vegetal', descriptionEn: 'Vegetable products', chapterRange: '06-14' },
      { id: '5', code: 'V', number: 5, description: 'Productos minerales', descriptionEn: 'Mineral products', chapterRange: '25-27' },
      { id: '6', code: 'VI', number: 6, description: 'Productos de las industrias químicas', descriptionEn: 'Chemical industries', chapterRange: '28-38' },
      { id: '15', code: 'XV', number: 15, description: 'Metales comunes y sus manufacturas', descriptionEn: 'Base metals', chapterRange: '72-83' },
      { id: '16', code: 'XVI', number: 16, description: 'Máquinas y aparatos, material eléctrico', descriptionEn: 'Machinery and electrical equipment', chapterRange: '84-85' },
      { id: '17', code: 'XVII', number: 17, description: 'Material de transporte', descriptionEn: 'Transport equipment', chapterRange: '86-89' }
    ];

    for (const section of sections) {
      try {
        sqliteDb.prepare(
          'INSERT OR IGNORE INTO hs_sections (id, code, number, description, description_en, chapter_range) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(section.id, section.code, section.number, section.description, section.descriptionEn, section.chapterRange);
      } catch (e) {}
    }

    // 2. Insertar Capítulos si no existen
    console.log('2. Insertando capítulos...');
    const chapters = [
      { id: '1', code: '01', description: 'Animales vivos', sectionCode: 'I' },
      { id: '2', code: '02', description: 'Carne y despojos comestibles', sectionCode: 'I' },
      { id: '3', code: '03', description: 'Pescados y crustáceos', sectionCode: 'I' },
      { id: '4', code: '04', description: 'Leche y productos lácteos; huevos', sectionCode: 'I' },
      { id: '10', code: '10', description: 'Cereales', sectionCode: 'II' },
      { id: '12', code: '12', description: 'Semillas y frutos oleaginosos', sectionCode: 'II' },
      { id: '26', code: '26', description: 'Minerales, escorias y cenizas', sectionCode: 'V' },
      { id: '27', code: '27', description: 'Combustibles minerales, aceites', sectionCode: 'V' },
      { id: '30', code: '30', description: 'Productos farmacéuticos', sectionCode: 'VI' },
      { id: '84', code: '84', description: 'Reactores nucleares, calderas, máquinas', sectionCode: 'XVI' },
      { id: '85', code: '85', description: 'Máquinas, aparatos y material eléctrico', sectionCode: 'XVI' },
      { id: '87', code: '87', description: 'Vehículos automóviles, tractores', sectionCode: 'XVII' }
    ];

    for (const chapter of chapters) {
      try {
        sqliteDb.prepare(
          'INSERT OR IGNORE INTO hs_chapters (id, code, description, description_en, section_code) VALUES (?, ?, ?, ?, ?)'
        ).run(chapter.id, chapter.code, chapter.description, chapter.description || '', chapter.sectionCode);
      } catch (e) {}
    }

    // 3. Procesar DATABASE de HSCode (Partidas y Subpartidas)
    console.log('3. Insertando partidas y subpartidas desde HS_CODES_DATABASE...');
    let partidaCount = 0;
    let subpartidaCount = 0;

    for (const hs of HS_CODES_DATABASE) {
      const chapterCode = hs.code.substring(0, 2);
      
      // Si el código tiene 4 dígitos, es una Partida
      if (hs.code.length === 4) {
        sqliteDb.prepare(
          'INSERT OR IGNORE INTO hs_partidas (id, code, description, description_en, chapter_code, tariff_rate, keywords) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(crypto.randomUUID(), hs.code, hs.description, hs.descriptionEn, chapterCode, hs.baseTariff, JSON.stringify(hs.keywords || []));
        partidaCount++;
      } 
      // Si el código tiene más de 4 dígitos, es una Subpartida
      else if (hs.code.length > 4) {
        const partidaCode = hs.code.substring(0, 4);
        sqliteDb.prepare(
          'INSERT OR IGNORE INTO hs_subpartidas (id, code, description, description_en, partida_code, chapter_code, tariff_rate, keywords, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(crypto.randomUUID(), hs.code, hs.description, hs.descriptionEn, partidaCode, chapterCode, hs.baseTariff, JSON.stringify(hs.keywords || []), 1);
        subpartidaCount++;
      }
    }

    console.log(`✅ Proceso completado: ${partidaCount} partidas and ${subpartidaCount} subpartidas insertadas (OR IGNORE).`);
    saveDatabase();
    console.log('💾 Database saved');

  } catch (error: any) {
    console.error('❌ Error general en el script de semillas:', error);
  }
}

main();
