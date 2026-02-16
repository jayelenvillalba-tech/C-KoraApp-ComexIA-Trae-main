import Database from 'better-sqlite3';
import { join } from 'path';

const backups = [
  'comexia_v2.db',
  'comexia_v2_backup_restored.db',
  'comexia_v2_before_full_restore.db',
  'backups/backup-2026-01-22/database/comexia_v2.db',
  'backups/backup-2026-01-07/database/comexia_v2.db',
  'backups/backup-2026-01-06/database/comexia_v2.db',
  'backups/backup-2025-12-24/database/comexia_v2.db'
];

console.log('🔍 Auditando Backups de Base de Datos\n');
console.log('='.repeat(80));

for (const dbPath of backups) {
  try {
    const fullPath = join(process.cwd(), dbPath);
    const db = new Database(fullPath, { readonly: true });
    
    const hsCount = db.prepare('SELECT COUNT(*) as count FROM hsSubpartidas').get() as { count: number };
    const regDocsCount = db.prepare('SELECT COUNT(*) as count FROM regulatoryRules').get() as { count: number };
    const companiesCount = db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number };
    
    console.log(`\n📁 ${dbPath}`);
    console.log(`   HS Codes: ${hsCount.count}`);
    console.log(`   Documentos Regulatorios: ${regDocsCount.count} ${regDocsCount.count > 10 ? '⭐' : ''}`);
    console.log(`   Empresas: ${companiesCount.count}`);
    
    if (regDocsCount.count > 10) {
      // Mostrar muestra de documentos
      const sample = db.prepare('SELECT countryCode, title FROM regulatoryRules LIMIT 5').all();
      console.log(`   Muestra:`, sample);
    }
    
    db.close();
  } catch (error: any) {
    console.log(`\n❌ ${dbPath}: ${error.message}`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('✅ Auditoría completada');
