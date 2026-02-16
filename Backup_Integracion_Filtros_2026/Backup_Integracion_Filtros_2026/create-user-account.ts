import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const dbPath = path.join(process.cwd(), 'comexia_v2.db');
const db = new Database(dbPath);

console.log('Creating user account for jayelen.villalba@gmail.com...\n');

// Check if user exists
const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get('jayelen.villalba@gmail.com');

if (existingUser) {
  console.log('✅ User already exists:', existingUser.email);
} else {
  // Create company first
  const companyId = 'che-comex-corp';
  const existingCompany = db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId);
  
  if (!existingCompany) {
    console.log('Creating company: Che.Comex...');
    db.prepare(`
      INSERT INTO companies (id, name, country, type, verified, created_at, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      companyId,
      'Che.Comex',
      'AR',
      'both',
      1,
      Date.now(),
      Date.now()
    );
  }

  // Create user
  const userId = crypto.randomUUID();
  const hashedPassword = bcrypt.hashSync('Comex2026!', 10);
  
  db.prepare(`
    INSERT INTO users (
      id, company_id, name, email, password, role, primary_role, 
      verified, created_at, last_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    companyId,
    'Jayelen Villalba',
    'jayelen.villalba@gmail.com',
    hashedPassword,
    'CEO',
    'admin',
    1,
    Date.now(),
    Date.now()
  );
  
  console.log('✅ User created successfully!');
  console.log('   Email: jayelen.villalba@gmail.com');
  console.log('   Password: Comex2026!');
  console.log('   Company: Che.Comex');
}

db.close();
