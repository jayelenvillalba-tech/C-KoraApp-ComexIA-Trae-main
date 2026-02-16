
import Database from 'better-sqlite3';
const db = new Database('backups/backup-2026-01-22/database/comexia_v2.db');
try {
  const columns = db.prepare("PRAGMA table_info(regulatory_rules)").all();
  console.log(JSON.stringify(columns, null, 2));
} catch(e) {
  console.log("Error checking regulatory_rules:", e.message);
}
try {
  const columns = db.prepare("PRAGMA table_info(country_requirements)").all();
  console.log("Country Requirements:", JSON.stringify(columns, null, 2));
} catch(e) {
}
db.close();
