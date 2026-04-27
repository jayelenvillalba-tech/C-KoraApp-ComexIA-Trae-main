import mongoose from 'mongoose';
import { User } from '../backend/models/index.ts';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to DB');
  const user = await User.findOne({ email: 'j.ayelen.villalba@gmail.com' });
  console.log('Hash in DB:', user?.password);
  if (user?.password) {
      const match = await bcrypt.compare('Benicio180', user.password);
      console.log('bcrypt lib compare result:', match);
      
      const bcryptjs = require('bcryptjs');
      const match2 = await bcryptjs.compare('Benicio180', user.password);
      console.log('bcryptjs lib compare result:', match2);
  }
  process.exit(0);
}
check();
