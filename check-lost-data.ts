
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbFiles = [
  'comexia_v2_before_full_restore.db',
  'comexia_v2_pre_migration_backup.db',
  'comexia_v2_backup_restored.db'
];

for (const dbFile of dbFiles) {
  const dbPath = path.join(process.cwd(), dbFile);
  if (!fs.existsSync(dbPath)) {
    console.log(`\nSkipping ${dbFile} (not found)`);
    continue;
  }

  console.log(`\n\n========== Checking ${dbFile} ==========`);
  
  try {
    const db = new Database(dbPath, { readonly: true });

    // List tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(`Tables found: ${tables.map(t => t.name).join(', ')}`);

    if (tables.some(t => t.name === 'users')) {
        // Check for users
        try {
            const users = db.prepare("SELECT id, email, name, role FROM users WHERE email LIKE '%che.comex%' OR name LIKE '%Che.Comex%'").all();
            console.log('\n--- Found Users ---');
            if (users.length > 0) {
                console.table(users);
            } else {
                console.log("No users found matching 'che.comex'");
            }
        } catch (e) {
            console.log("Error querying users:", e.message);
        }
    }

    if (tables.some(t => t.name === 'marketplace_posts')) {
        // Check for marketplace posts
        try {
            const postCount = db.prepare("SELECT count(*) as count FROM marketplace_posts").get();
            console.log('\n--- Marketplace Posts Count ---');
            console.log(postCount);

            // Check for recent posts
            const recentPosts = db.prepare("SELECT id, title, created_at FROM marketplace_posts ORDER BY created_at DESC LIMIT 5").all();
            console.log('\n--- Recent Posts ---');
            console.table(recentPosts);
        } catch (e) {
             console.log("Error querying marketplace_posts:", e.message);
        }
    }

    db.close();
  } catch (error) {
    console.error(`Error opening/checking ${dbFile}:`, error.message);
  }
}
