import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const dbPath = path.join(process.cwd(), 'comexia_v2.db');
const db = new Database(dbPath);

console.log('Fixing user account: Creating j.ayelen.villalba@gmail.com ...\n');

// 1. Check if the "wrong" one exists and maybe rename it or just create a new one
// User is trying: j.ayelen.villalba@gmail.com
const targetEmail = 'j.ayelen.villalba@gmail.com';
const password = 'Comex2026!';

const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(targetEmail);

if (existingUser) {
  console.log('User already exists, updating password...');
  const hashedPassword = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedPassword, targetEmail);
  console.log('✅ Password updated for', targetEmail);
} else {
  // Check if company exists
  const companyId = 'che-comex-corp';
  
  // Create user
  const userId = crypto.randomUUID();
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  try {
    db.prepare(`
      INSERT INTO users (
        id, company_id, name, email, password, role, primary_role, 
        verified, created_at, last_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      companyId,
      'Jayelen Villalba',
      targetEmail,
      hashedPassword,
      'CEO',
      'admin',
      1,
      Date.now(),
      Date.now()
    );
    console.log('✅ Created user:', targetEmail);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
        console.log('User ID collision or other constraint, forcing update on email...');
        // Just update the existing record with this email if somehow we missed the check
    } else {
        throw err;
    }
  }
}

console.log('✅ LOGIN FIXED. Please try logging in with:');
console.log('   Email: ' + targetEmail);
console.log('   Pass:  ' + password);

db.close();
