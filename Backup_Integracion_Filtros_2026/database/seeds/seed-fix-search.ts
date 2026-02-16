import { db } from '../db-sqlite';
import { hsSubpartidas } from '../../shared/schema-sqlite';
import { sql } from 'drizzle-orm';

async function seedCriticalCommodities() {
  console.log('🌱 Seeding critical commodities...');

  const commodities = [
    {
      code: '100119',
      description: 'Trigo duro, excepto para siembra',
      descriptionEn: 'Durum wheat, other than seed',
      sectionCode: '02',
      chapterCode: '10',
      headingCode: '1001',
      subHeadingCode: '100119',
      keywords: 'trigo, wheat, cereal, grano',
      isActive: 1
    },
    {
      code: '120190',
      description: 'Habas (porotos, frijoles, fréjoles) de soja, excepto para siembra',
      descriptionEn: 'Soya beans, whether or not broken, other than seed',
      sectionCode: '02',
      chapterCode: '12',
      headingCode: '1201',
      subHeadingCode: '120190',
      keywords: 'soja, soya, bean, oilseed',
      isActive: 1
    },
    {
        code: '100630',
        description: 'Arroz semiblanqueado o blanqueado, incluso pulido o glaseado',
        descriptionEn: 'Semi-milled or wholly milled rice, whether or not polished or glazed',
        sectionCode: '02',
        chapterCode: '10',
        headingCode: '1006',
        subHeadingCode: '100630',
        keywords: 'arroz, rice, cereal',
        isActive: 1
    },
    {
        code: '0901',
        description: 'Cafe, incluso tostado o descafeinado; cascara y cascarilla de cafe',
        descriptionEn: 'Coffee, whether or not roasted or decaffeinated',
        sectionCode: '02',
        chapterCode: '09',
        headingCode: '0901',
        subHeadingCode: '0901',
        keywords: 'cafe, coffee, grano',
        isActive: 1
    },
    {
        code: '2204',
        description: 'Vino de uvas frescas, incluso encabezado; mosto de uva',
        descriptionEn: 'Wine of fresh grapes, including fortified wines; grape must',
        sectionCode: '04',
        chapterCode: '22',
        headingCode: '2204',
        subHeadingCode: '2204',
        keywords: 'vino, wine, bebida, alcohol, uva',
        isActive: 1
    }
  ];

  for (const item of commodities) {
    try {
      // Usamos insert or replace para asegurar que este
      await db.run(sql`
        INSERT OR REPLACE INTO hs_subpartidas (
          code, description, description_en, section_code, chapter_code, 
          heading_code, sub_heading_code, keywords, is_active, id
        ) VALUES (
          ${item.code}, ${item.description}, ${item.descriptionEn}, 
          ${item.sectionCode}, ${item.chapterCode}, ${item.headingCode}, 
          ${item.subHeadingCode}, ${item.keywords}, ${item.isActive}, ${item.code}
        )
      `);
      console.log(`✅ Inserted/Updated: ${item.description}`);
    } catch (e) {
      console.error(`❌ Error inserting ${item.code}:`, e);
    }
  }

  console.log('✨ Seed completed.');
}

seedCriticalCommodities().catch(console.error);
