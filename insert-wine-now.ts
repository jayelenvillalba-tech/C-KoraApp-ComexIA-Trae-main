import Database from 'better-sqlite3';
import crypto from 'crypto';

const db = new Database('comexia_v2.db');

console.log('🍷 Insertando datos de VINO directamente...');

const wineData = [
  {
    code: '2204',
    description: 'Vino de uvas frescas, incluso encabezado; mosto de uva',
    descriptionEn: 'Wine of fresh grapes, including fortified wines; grape must',
    partidaCode: '2204',
    chapterCode: '22',
    tariffRate: 35,
    keywords: JSON.stringify(['vino', 'wine', 'uva', 'grape', 'bebida', 'alcohol'])
  },
  {
    code: '220410',
    description: 'Vino espumoso',
    descriptionEn: 'Sparkling wine',
    partidaCode: '2204',
    chapterCode: '22',
    tariffRate: 35,
    keywords: JSON.stringify(['vino', 'wine', 'espumoso', 'sparkling', 'champagne'])
  },
  {
    code: '220421',
    description: 'Vino en recipientes con capacidad inferior o igual a 2 litros',
    descriptionEn: 'Wine in containers holding 2 liters or less',
    partidaCode: '2204',
    chapterCode: '22',
    tariffRate: 35,
    keywords: JSON.stringify(['vino', 'wine', 'botella', 'bottle'])
  }
];

const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO hs_subpartidas 
  (id, code, description, description_en, partida_code, chapter_code, tariff_rate, keywords, is_active) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
`);

for (const wine of wineData) {
  insertStmt.run(
    crypto.randomUUID(),
    wine.code,
    wine.description,
    wine.descriptionEn,
    wine.partidaCode,
    wine.chapterCode,
    wine.tariffRate,
    wine.keywords
  );
  console.log(`✅ Insertado: ${wine.code} - ${wine.description}`);
}

// Verificar
const count = db.prepare("SELECT COUNT(*) as c FROM hs_subpartidas WHERE description LIKE '%vino%' OR description LIKE '%Vino%'").get();
console.log(`\n🍷 Total registros de vino en DB: ${count.c}`);

db.close();
console.log('✅ Completado');
