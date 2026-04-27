import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI as string).then(async () => {
    const hash = await bcrypt.hash('Benicio180', 10);
    const result = await mongoose.connection.db.collection('users').updateOne(
        { email: 'j.ayelen.villalba@gmail.com' },
        { $set: { password: hash } }
    );
    console.log('Update result:', result);
    process.exit(0);
});
