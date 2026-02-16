
import { getSqliteDb, initDatabase } from './db-sqlite.js';
import fs from 'fs';

async function verify() {
  console.log('🔄 Iniciando verificación robusta...');
  try {
    await initDatabase();
    const db = getSqliteDb();

    if (!db) {
       throw new Error('La base de datos no se inicializó correctamente (db is null)');
    }
    
    console.log('📚 Base de datos cargada. Ejecutando conteos...');

    const query = (sql, label) => {
        try {
            const res = db.prepare(sql).get();
            console.log(`✅ ${label}: ${res.count}`);
            return res.count;
        } catch(e) {
            console.error(`❌ Error consultando ${label}:`, e);
            return 0;
        }
    };

    const countries = query('SELECT COUNT(*) as count FROM countries', 'Países');
    const sections = query('SELECT COUNT(*) as count FROM hs_sections', 'Secciones HS');
    const chapters = query('SELECT COUNT(*) as count FROM hs_chapters', 'Capítulos HS');
    const subpartidas = query('SELECT COUNT(*) as count FROM hs_subpartidas', 'Subpartidas HS');
    const rules = query('SELECT COUNT(*) as count FROM country_requirements', 'Reglas Regulatorias');

    const report = `
🔍 REPORTE FINAL
================
🌍 Países: ${countries}
📁 Secciones: ${sections}
📖 Capítulos: ${chapters}
🏷️ HS Codes: ${subpartidas}
📜 Reglas: ${rules}

VALIDACIÓN: ${subpartidas > 2000 && countries > 160 ? 'EXITOSA' : 'FALLIDA'}
`;

    console.log('✍️ Escribiendo reporte en disco...');
    fs.writeFileSync('restoration_report.txt', report);
    console.log('✅ Verificación completada exitosamente.');

  } catch (err) {
    console.error('💥 Error Fatal en Verificación:', err);
    fs.writeFileSync('restoration_report.txt', `ERROR FATAL: ${err.message}`);
  }
}

verify().catch(console.error);
