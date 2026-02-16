
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'comexia_v2_pre_migration_backup.db');
const outputPath = path.join(process.cwd(), 'dump_output.txt');
const log = (msg) => fs.appendFileSync(outputPath, msg + '\n');

// Clear previous output
fs.writeFileSync(outputPath, '');

log(`Exploratory dump of: ${dbPath}`);

try {
  const db = new Database(dbPath, { readonly: true });

  // List all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  log('\n--- Tables ---');
  log(JSON.stringify(tables, null, 2));

  // Dump all users (limit 50)
  if (tables.some(t => t.name === 'users')) {
      const users = db.prepare("SELECT * FROM users LIMIT 50").all();
      log('\n--- All Users (First 50) ---');
      log(JSON.stringify(users, null, 2));
  }

  // Check for companies table
  if (tables.some(t => t.name === 'companies')) {
      const companies = db.prepare("SELECT * FROM companies").all();
      log('\n--- Companies ---');
      log(JSON.stringify(companies, null, 2));
  }

  db.close();
  console.log('Dump complete. Check dump_output.txt');
} catch (error) {
  log(`Error: ${error.message}`);
  console.error('Error:', error.message);
}
