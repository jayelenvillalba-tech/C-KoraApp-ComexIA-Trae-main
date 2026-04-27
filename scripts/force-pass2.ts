import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const hash = await bcrypt.hash('Benicio180', 10);
    const res = await mongoose.connection.collection('users').updateOne(
        { email: 'j.ayelen.villalba@gmail.com' },
        { $set: { password: hash } }
    );
    console.log('Update result:', res);
    process.exit(0);
}

run();
