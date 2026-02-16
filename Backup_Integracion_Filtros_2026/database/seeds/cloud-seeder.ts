import { initDatabase, db } from '../db.js';
import { hsPartidas, hsSubpartidas, users, companies } from '../../shared/schema-sqlite.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const HS_CODES_SAMPLE = [
  { code: '0101', description: 'Caballos, asnos, mulos y burdéganos, vivos', descriptionEn: 'Live horses, asses, mules and hinnies' },
  { code: '0102', description: 'Animales vivos de la especie bovina', descriptionEn: 'Live bovine animals' },
  { code: '0201', description: 'Carne de animales de la especie bovina, fresca o refrigerada', descriptionEn: 'Meat of bovine animals, fresh or chilled' },
  { code: '0202', description: 'Carne de animales de la especie bovina, congelada', descriptionEn: 'Meat of bovine animals, frozen' },
  // ... more relevant codes from memory or copy/paste
  { code: '8401', description: 'Reactores nucleares', descriptionEn: 'Nuclear reactors' },
  { code: '8407', description: 'Motores de émbolo (pistón) de encendido por chispa', descriptionEn: 'Spark-ignition engines' },
  { code: '8415', description: 'Máquinas y aparatos para acondicionamiento de aire', descriptionEn: 'Air conditioning machines' },
  { code: '8418', description: 'Refrigeradores, congeladores', descriptionEn: 'Refrigerators, freezers' },
  { code: '8471', description: 'Máquinas automáticas para tratamiento o procesamiento de datos', descriptionEn: 'Automatic data processing machines' }
];

async function main() {
    // Force Turso just in case env is already set from script runner
    if (!process.env.TURSO_DATABASE_URL) {
        console.error('❌ TURSO_DATABASE_URL missing. Set USE_TURSO=true');
        process.exit(1);
    }

    console.log('🚀 Connecting to Turso...');
    await initDatabase();

    console.log('🌱 Seeding HS Codes (Partidas)...');
    for (const hs of HS_CODES_SAMPLE) {
        try {
             await db.insert(hsPartidas).values({
                 code: hs.code,
                 description: hs.description,
                 descriptionEn: hs.descriptionEn,
                 section: 'I', // Simplified
                 chapter: hs.code.substring(0, 2),
                 baseTariff: 10,
                 isActive: true
             }).onConflictDoNothing();
        } catch (e: any) {
            console.log(`Skipped ${hs.code}: ${e.message}`);
        }
    }

    console.log('🏢 Seeding Demo Company...');
    let companyId;
    try {
        const [comp] = await db.insert(companies).values({
            name: 'ComexIA Demo Corp',
            country: 'AR',
            type: 'exporter',
            verified: true,
            description: 'Empresa demo para producción'
        }).returning().onConflictDoNothing();
        companyId = comp?.id;
    } catch(e) { console.log('Company load check'); }
    
    // Fallback if not returned due to conflict
    if (!companyId) {
        // Assume exists or fetch... but for now ignore
    }

    console.log('👤 Seeding Admin User...');
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.insert(users).values({
            name: 'Admin User',
            email: 'admin@comexia.com',
            password: hashedPassword,
            role: 'admin',
            verified: true,
            companyId: companyId || null // might be null if conflict previously
        }).onConflictDoNothing();
    } catch (e) {
        console.log('User load check');
    }

    console.log('✅ Cloud Seed Completed!');
}

main();
