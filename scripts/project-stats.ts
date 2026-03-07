
import mongoose from 'mongoose';
import { User, Company, MarketplacePost } from '../backend/models';
import { HSCode } from '../backend/models/HSCode';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function gatherStats() {
    if (!MONGODB_URI) {
        console.error('MONGODB_URI not found');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Geography & Coverage
        // We don't have a Country model populated yet? Or do we?
        // Let's check unique originCountry in posts/companies
        const distinctCountries = await Company.distinct('country');
        const numCountries = distinctCountries.length;

        // 2. Products (HS Codes)
        const totalHSCodes = await HSCode.countDocuments();
        
        // Breakdown by level (approximate based on code length)
        // Chapter: 2, Heading: 4, Subheading: 6
        const chapters = await HSCode.countDocuments({ code: { $regex: /^\d{2}$/ } });
        const headings = await HSCode.countDocuments({ code: { $regex: /^\d{4}$/ } });
        const subheadings = await HSCode.countDocuments({ code: { $regex: /^\d{6}$/ } });

        // 3. Ecosystem
        const totalUsers = await User.countDocuments();
        const verifiedUsers = await User.countDocuments({ verified: true });
        
        const totalCompanies = await Company.countDocuments();
        const verifiedCompanies = await Company.countDocuments({ verified: true });

        // 4. Marketplace
        const totalPosts = await MarketplacePost.countDocuments();
        const activePosts = await MarketplacePost.countDocuments({ status: 'active' });
        const buyPosts = await MarketplacePost.countDocuments({ type: 'buy' });
        const sellPosts = await MarketplacePost.countDocuments({ type: 'sell' });

        // 5. Treaties/Documents (Universal Laws?)
        // Currently we don't have a TradeAgreement model. 
        // We have 'documents-data.ts' or Regulation model?
        // Let's check Regulation if it exists
        let totalRegulations = 0;
        try {
            // dynamic import or just check collection
            const regulationsCount = await mongoose.connection.db.collection('regulations').countDocuments();
            totalRegulations = regulationsCount;
        } catch (e) {
            console.log('No regulations collection found');
        }

        console.log('\n--- PROJECT STATUS REPORT ---');
        console.log('TIMESTAMP:', new Date().toISOString());
        
        console.log('\n🌍 GEOGRAPHY');
        console.log(`Active Countries (via Companies): ${numCountries} (${distinctCountries.join(', ')})`);
        
        console.log('\n📦 PRODUCTS (HS CODES)');
        console.log(`Total HS Codes in DB: ${totalHSCodes}`);
        console.log(`- Chapters (2-digit): ${chapters}`);
        console.log(`- Headings (4-digit): ${headings}`);
        console.log(`- Subheadings (6-digit): ${subheadings}`);
        
        console.log('\n👥 ECOSYSTEM');
        console.log(`Total Users: ${totalUsers} (Verified: ${verifiedUsers})`);
        console.log(`Total Companies: ${totalCompanies} (Verified: ${verifiedCompanies})`);
        
        console.log('\n🛒 MARKETPLACE');
        console.log(`Total Posts: ${totalPosts} (Active: ${activePosts})`);
        console.log(`- Buy Requests: ${buyPosts}`);
        console.log(`- Sell Offers: ${sellPosts}`);
        
        console.log('\n📜 LEGAL & COMPLIANCE');
        console.log(`Regulations/Treaties Indexed: ${totalRegulations}`);

        console.log('\n-----------------------------');

    } catch (error) {
        console.error('Error gathering stats:', error);
    } finally {
        await mongoose.disconnect();
    }
}

gatherStats();
