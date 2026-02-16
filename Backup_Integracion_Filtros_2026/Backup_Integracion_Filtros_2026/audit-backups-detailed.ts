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

console.log('🔍 AUDITORÍA DE BACKUPS - Documentos y HS Codes\n');
console.log('='.repeat(90));

let bestBackup = { path: '', hsCount: 0, docsCount: 0, regRulesCount: 0 };

for (const dbPath of backups) {
  try {
    const fullPath = join(process.cwd(), dbPath);
    const db = new Database(fullPath, { readonly: true });
    
    // Check HS Codes
    const hsCount = db.prepare('SELECT COUNT(*) as count FROM hsSubpartidas').get() as { count: number };
    
    // Check countryRequirements
    let docsCount = 0;
    try {
      docsCount = (db.prepare('SELECT COUNT(*) as count FROM countryRequirements').get() as { count: number }).count;
    } catch (e) {
      // Table might not exist in older backups
    }
    
    // Check regulatoryRules (old table name)
    let regRulesCount = 0;
    try {
      regRulesCount = (db.prepare('SELECT COUNT(*) as count FROM regulatoryRules').get() as { count: number }).count;
    } catch (e) {
      // Table might not exist
    }
    
    console.log(`\n📁 ${dbPath}`);
    console.log(`   HS Codes: ${hsCount.count.toLocaleString()} ${hsCount.count > 3000 ? '⭐⭐' : hsCount.count > 2500 ? '⭐' : ''}`);
    console.log(`   Country Requirements: ${docsCount.toLocaleString()}`);
    console.log(`   Regulatory Rules: ${regRulesCount.toLocaleString()} ${regRulesCount > 10 ? '⭐' : ''}`);
    
    // Track best backup
    if (hsCount.count > bestBackup.hsCount || regRulesCount > bestBackup.regRulesCount) {
      bestBackup = { 
        path: dbPath, 
        hsCount: hsCount.count, 
        docsCount, 
        regRulesCount 
      };
    }
    
    // Show sample if has data
    if (regRulesCount > 0) {
      const sample = db.prepare('SELECT countryCode, title FROM regulatoryRules LIMIT 3').all();
      console.log(`   📄 Muestra:`, sample);
    }
    
    db.close();
  } catch (error: any) {
    console.log(`\n❌ ${dbPath}: ${error.message}`);
  }
}

console.log('\n' + '='.repeat(90));
console.log(`\n🏆 MEJOR BACKUP ENCONTRADO: ${bestBackup.path}`);
console.log(`   HS Codes: ${bestBackup.hsCount.toLocaleString()}`);
console.log(`   Regulatory Rules: ${bestBackup.regRulesCount.toLocaleString()}`);
console.log(`   Country Requirements: ${bestBackup.docsCount.toLocaleString()}`);

if (bestBackup.regRulesCount > 0 || bestBackup.hsCount > 2500) {
  console.log(`\n✅ RECOMENDACIÓN: Restaurar datos de este backup`);
} else {
  console.log(`\n⚠️  No se encontraron datos significativos en backups`);
}
