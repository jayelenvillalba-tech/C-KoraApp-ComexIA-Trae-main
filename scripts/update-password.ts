import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../backend/models/index.ts';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const email = 'j.ayelen.villalba@gmail.com';
    const hash = await bcrypt.hash('Benicio180', 10);
    const user = await User.findOneAndUpdate({ email }, { password: hash }, { new: true });
    
    if (user) {
        console.log('Password updated successfully for:', email);
    } else {
        console.log('User not found:', email);
    }
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

run();
