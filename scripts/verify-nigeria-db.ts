
import mongoose from 'mongoose';
import { Regulation } from '../backend/models';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI!);
    
    // Check Specific Rules for Nigeria
    const wheatRule = await Regulation.findOne({ 
        countryCode: 'NG', 
        hsCode: '1001' 
    });
    
    // Check Transversal Laws
    const law = await Regulation.findOne({ 
        documentName: { $regex: 'AU Model Law' } 
    });
    
    console.log('Nigeria Wheat Rule:', wheatRule ? 'FOUND' : 'MISSING');
    if (wheatRule) console.log(JSON.stringify(wheatRule, null, 2));
    
    console.log('Africa Data Law:', law ? 'FOUND' : 'MISSING');
    
    await mongoose.disconnect();
}
check();
