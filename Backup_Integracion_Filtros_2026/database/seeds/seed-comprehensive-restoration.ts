
import { db, initDatabase, saveDatabase } from '../db-sqlite.js';
import { 
  hsSections, 
  hsChapters, 
  countries,
  hsSubpartidas,
  countryBaseRequirements
} from '../../shared/schema-sqlite.js';
import { HS_SECTIONS, HS_CHAPTERS } from '../../shared/complete-hs-nomenclature.js';
import { countries as countriesData } from '../../shared/countries-data.js';
import { HS_CODES_DATABASE } from '../../shared/hs-codes-database.js';
import crypto from 'crypto';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('🏗️ INICIANDO RESTAURACIÓN COMPLETA DE DATOS (Phase 1) - ORM VERSION...');
  
  try {
    await initDatabase();
    
    // 1. Restaurar Secciones HS
    console.log(`📁 Restaurando ${HS_SECTIONS.length} Secciones HS...`);
    for (const section of HS_SECTIONS) {
      await db.insert(hsSections).values({
        id: section.id,
        code: section.code,
        number: section.number,
        description: section.description,
        descriptionEn: section.descriptionEn,
        chapterRange: section.chapterRange
      }).onConflictDoUpdate({ target: hsSections.id, set: { description: section.description } });
    }

    // 2. Restaurar Capítulos HS
    console.log(`📖 Restaurando ${HS_CHAPTERS.length} Capítulos HS...`);
    for (const chapter of HS_CHAPTERS) {
      await db.insert(hsChapters).values({
        id: chapter.id,
        sectionCode: chapter.sectionCode,
        code: chapter.code,
        description: chapter.description,
        descriptionEn: chapter.descriptionEn,
        notes: chapter.notes,
        notesEn: chapter.notesEn
      }).onConflictDoUpdate({ target: hsChapters.id, set: { description: chapter.description } });
    }

    // 3. Restaurar Países
    console.log(`🌍 Restaurando ${countriesData.length} Países...`);
    for (const country of countriesData) {
      await db.insert(countries).values({
        code: country.code,
        name: country.name,
        nameEn: country.nameEn,
        region: country.region,
        flagUrl: null,
        currency: 'USD',
        languages: 'ES',
        timezone: 'UTC'
      }).onConflictDoUpdate({ target: countries.code, set: { name: country.name } });

      const baseDocs = JSON.stringify([
        { name: 'Factura Comercial', importance: 'Mandatory', issuer: 'Exportador' },
        { name: 'Lista de Empaque', importance: 'Mandatory', issuer: 'Exportador' },
        { name: 'Documento de Transporte', importance: 'Mandatory', issuer: 'Transportista' }
      ]);
      
      await db.insert(countryBaseRequirements).values({
          id: crypto.randomUUID(),
          countryCode: country.code,
          importGuideUrl: null,
          generalNotes: `Datos restaurados para ${country.name}`,
          requiredDocuments: baseDocs,
          specializedAgencies: '[]'
      }).onConflictDoNothing();
    }

    // 4. Restaurar HS Codes
    console.log(`🏷️ Restaurando ${HS_CODES_DATABASE.length} Códigos HS Específicos...`);
    for (const hs of HS_CODES_DATABASE) {
      const chapterCode = hs.code.substring(0, 2);
      const partidaCode = hs.code.substring(0, 4);
      
      await db.insert(hsSubpartidas).values({
        code: hs.code,
        description: hs.description,
        descriptionEn: hs.descriptionEn,
        chapterCode: chapterCode,
        partidaCode: partidaCode,
        tariffRate: hs.baseTariff,
        keywords: JSON.stringify(hs.keywords),
        isActive: true
      }).onConflictDoUpdate({ target: hsSubpartidas.code, set: { description: hs.description } });
    }

    console.log('💾 Guardando base de datos...');
    saveDatabase();
    
    console.log('✅ Fase 1 completada exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la restauración:', error);
    process.exit(1);
  }
}

main();
