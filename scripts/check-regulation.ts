
import mongoose from 'mongoose';
import { Regulation } from '../backend/models';
import dotenv from 'dotenv';
dotenv.config();

async function checkReg() {
    await mongoose.connect(process.env.MONGODB_URI!);
    const reg = await Regulation.findOne({ type: 'import' });
    console.log('Sample Regulation:', JSON.stringify(reg, null, 2));
    await mongoose.disconnect();
}
checkReg();
