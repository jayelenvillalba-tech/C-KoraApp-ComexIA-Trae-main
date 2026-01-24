
import Database from 'better-sqlite3';
const db = new Database('comexia_v2.db');
const columns = db.prepare("PRAGMA table_info(regulatory_rules)").all();
console.log(JSON.stringify(columns, null, 2));
db.close();
