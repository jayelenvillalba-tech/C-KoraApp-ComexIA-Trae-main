import Database from 'better-sqlite3';

console.log('📊 ESTADO ACTUAL DE LA BASE DE DATOS\n');

const db = new Database('comexia_v2.db');

// List all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tablas disponibles:', tables.map((t: any) => t.name).join(', '));
console.log('');

// Count HS Codes
const hsCount = db.prepare('SELECT COUNT(*) as c FROM hsSubpartidas').get() as { c: number };
console.log(`✅ HS Codes: ${hsCount.c.toLocaleString()}`);

// Count Country Requirements
try {
  const crCount = db.prepare('SELECT COUNT(*) as c FROM countryRequirements').get() as { c: number };
  console.log(`📄 Country Requirements: ${crCount.c.toLocaleString()}`);
  
  if (crCount.c > 0) {
    const sample = db.prepare('SELECT * FROM countryRequirements LIMIT 2').all();
    console.log('   Muestra:', JSON.stringify(sample, null, 2));
  }
} catch (e: any) {
  console.log(`❌ Country Requirements: Tabla no existe o error - ${e.message}`);
}

// Count Regulatory Rules (old table)
try {
  const rrCount = db.prepare('SELECT COUNT(*) as c FROM regulatoryRules').get() as { c: number };
  console.log(`📋 Regulatory Rules: ${rrCount.c.toLocaleString()}`);
  
  if (rrCount.c > 0) {
    const sample = db.prepare('SELECT countryCode, title, category FROM regulatoryRules LIMIT 3').all();
    console.log('   Muestra:', JSON.stringify(sample, null, 2));
  }
} catch (e: any) {
  console.log(`ℹ️  Regulatory Rules: Tabla no existe (normal si se migró a countryRequirements)`);
}

db.close();

console.log('\n✅ Auditoría completada');
