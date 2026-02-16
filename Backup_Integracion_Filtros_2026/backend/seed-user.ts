import { db, initDatabase } from '../database/db-sqlite';
import { users, companies } from '../shared/schema-sqlite';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

async function seed() {
  try {
    await initDatabase(); // Initialize DB first

    console.log('🌱 Seeding specific user...');
    
    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.email, 'j.ayelen.villalba@gmail.com'));
    if (existing.length > 0) {
        console.log('✅ User already exists');
        return;
    }

    // Create Company
    const companyId = crypto.randomUUID();
    await db.insert(companies).values({
        id: companyId,
        name: 'Che Comex Corp',
        country: 'AR',
        type: 'exporter',
        verified: true
    });

    // Create User
    const hashedPassword = await bcrypt.hash('demo123', 10);
    await db.insert(users).values({
        id: crypto.randomUUID(),
        name: 'J. Ayelen Villalba',
        email: 'j.ayelen.villalba@gmail.com',
        password: hashedPassword,
        companyId: companyId,
        role: 'admin',
        verified: true
    });
    
    console.log('✅ User created: j.ayelen.villalba@gmail.com / demo123');
  } catch (e) {
    console.error('❌ Error seeding:', e);
  }
}

seed();
