
import Database from 'better-sqlite3';
const db = new Database('backups/backup-2026-01-22/database/comexia_v2.db');
try {
  const rows = db.prepare("SELECT * FROM country_requirements LIMIT 1").all();
  console.log(JSON.stringify(rows, null, 2));
} catch(e) {
  console.log("Error reading country_requirements:", e.message);
}
db.close();
