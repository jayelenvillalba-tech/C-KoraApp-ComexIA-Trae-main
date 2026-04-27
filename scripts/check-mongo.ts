import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config();

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI as string);
  try {
    await client.connect();
    const db = client.db();
    const user = await db.collection('users').findOne({ email: new RegExp('ayelen', 'i') });
    console.log('User found:', user?.email);
    console.log('Password hash:', user?.password);
    
    if (user?.password) {
        const match = await bcrypt.compare('Benicio180', user.password);
        console.log('Does Benicio180 match? ', match);
    }
  } finally {
    await client.close();
  }
}
run().catch(console.error);
