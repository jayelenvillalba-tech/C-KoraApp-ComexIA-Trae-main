
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { initDatabase, getDb } from '../../database/db-sqlite';
import * as schema from '../../shared/schema-sqlite';
import { 
  User, 
  Company, 
  MarketplacePost, 
  HSCode, 
  Country, 
  Conversation, 
  Message,
  Regulation
} from '../models';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

// Helper to clean dates and types
function cleanData(obj: any) {
    const cleaned = { ...obj };
    
    // Handle Dates
    // SQLite might return number (timestamp ms) or string
    // If invalid, new Date(invalid) returns 'Invalid Date'.
    // Helper to safely parse date or use fallback
    const safeDate = (val: any) => {
        if (!val) return undefined;
        const d = new Date(val);
        return isNaN(d.getTime()) ? undefined : d;
    };

    if (cleaned.createdAt) cleaned.createdAt = safeDate(cleaned.createdAt) || new Date();
    if (cleaned.updatedAt) cleaned.updatedAt = safeDate(cleaned.updatedAt) || new Date();
    
    if (cleaned.establishedYear) cleaned.establishedYear = Number(cleaned.establishedYear) || undefined;
    
    // Handle Booleans
    if (typeof cleaned.verified === 'number') cleaned.verified = cleaned.verified === 1;
    if (typeof cleaned.sanctions === 'number') cleaned.sanctions = cleaned.sanctions === 1;
    
    // Remove nulls 
    Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === null) delete cleaned[key];
    });

    return cleaned;
}

// ... (rest of the file is same as previous, just updating cleanData helper)
// I will rewrite the whole file to ensure it's correct.

async function migrate() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not defined in .env');
    process.exit(1);
  }

  try {
    // Initialize SQLite
    console.log('🔄 Initializing SQLite...');
    const db = await initDatabase();
    
    if (!db) {
        throw new Error('Failed to initialize SQLite database');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Migrate Countries
    console.log('🌍 Migrating Countries...');
    const countriesData = await db.select().from(schema.countries);
    if (countriesData.length > 0) {
      await Country.deleteMany({}); 
      // Clean countries
      const cleanCountries = countriesData.map(c => cleanData(c));
      await Country.insertMany(cleanCountries);
      console.log(`✅ Migrated ${countriesData.length} countries`);
    }

    // 2. Migrate HS Codes
    console.log('📦 Migrating HS Codes...');
    const hsCodesData = await db.select().from(schema.hsSubpartidas);
    if (hsCodesData.length > 0) {
      await HSCode.deleteMany({});
      const hsDocs = hsCodesData.map(h => ({
        ...cleanData(h),
        _id: undefined
      }));
      await HSCode.insertMany(hsDocs);
      console.log(`✅ Migrated ${hsDocs.length} HS Codes`);
    }

    // 3. Migrate Companies
    console.log('🏢 Migrating Companies...');
    const companiesData = await db.select().from(schema.companies);
    const companyIdMap = new Map<string, string>();
    
    if (companiesData.length > 0) {
      await Company.deleteMany({});
      for (const comp of companiesData) {
        try {
            const { id: oldId, ...rest } = comp;
            const cleaned = cleanData(rest);
            const newComp = await Company.create(cleaned);
            companyIdMap.set(oldId, newComp._id.toString());
        } catch (err: any) {
            console.error(`⚠️ Failed to migrate company ${comp.name}:`, err.message);
        }
      }
      console.log(`✅ Migrated companies (processed ${companiesData.length})`);
    }

    // 4. Migrate Users
    console.log('👤 Migrating Users...');
    const usersData = await db.select().from(schema.users);
    const userIdMap = new Map<string, string>();
    
    if (usersData.length > 0) {
      await User.deleteMany({});
      for (const u of usersData) {
        try {
            const { id: oldId, companyId, ...rest } = u;
            const newCompanyId = companyId ? companyIdMap.get(companyId) : undefined;
            const cleaned = cleanData(rest);
            
            const newUser = await User.create({
              ...cleaned,
              companyId: newCompanyId
            });
            userIdMap.set(oldId, newUser._id.toString());
        } catch (err: any) {
             console.error(`⚠️ Failed to migrate user ${u.email}:`, err.message);
        }
      }
      console.log(`✅ Migrated users (processed ${usersData.length})`);
    }

    // 5. Migrate Marketplace Posts
    console.log('🛍️ Migrating Marketplace Posts...');
    const postsData = await db.select().from(schema.marketplacePosts);
    const postIdMap = new Map<string, string>();

    if (postsData.length > 0) {
      await MarketplacePost.deleteMany({});
      for (const p of postsData) {
        try {
            const { id: oldId, companyId, userId, ...rest } = p;
            const newCompanyId = companyIdMap.get(companyId);
            const newUserId = userIdMap.get(userId);
            
            if (newCompanyId && newUserId) {
               const cleaned = cleanData(rest);
               // Parse JSON fields
               if (typeof cleaned.requirements === 'string') {
                   try { cleaned.requirements = JSON.parse(cleaned.requirements); } catch(e) { cleaned.requirements = [cleaned.requirements]; }
               }
               if (typeof cleaned.certifications === 'string') {
                   try { cleaned.certifications = JSON.parse(cleaned.certifications); } catch(e) { cleaned.certifications = [cleaned.certifications]; }
               }
               if (typeof cleaned.tradePreferences === 'string') {
                   try { cleaned.tradePreferences = JSON.parse(cleaned.tradePreferences); } catch(e) {}
               }
               if (typeof cleaned.photos === 'string') {
                   try { cleaned.photos = JSON.parse(cleaned.photos); } catch(e) { cleaned.photos = []; }
               }

               const newPost = await MarketplacePost.create({
                 ...cleaned,
                 companyId: newCompanyId,
                 userId: newUserId
               });
               postIdMap.set(oldId, newPost._id.toString());
            }
        } catch (err: any) {
            console.error(`⚠️ Failed to migrate post ${p.productName}:`, err.message);
        }
      }
      console.log(`✅ Migrated posts`); 
    }
    
    // 6. Migrate Conversations
    console.log('💬 Migrating Conversations...');
    const conversationsData = await db.select().from(schema.conversations);
    
    if (conversationsData.length > 0) {
        await Conversation.deleteMany({});
        await Message.deleteMany({}); 
        
        const conversationIdMap = new Map<string, string>();

        for (const c of conversationsData) {
            try {
                const { id: oldId, company1Id, company2Id, postId, ...rest } = c;
                const newC1 = companyIdMap.get(company1Id);
                const newC2 = companyIdMap.get(company2Id);
                const newPostId = postId ? postIdMap.get(postId) : undefined;
                
                if (newC1 && newC2) {
                    const cleaned = cleanData(rest);
                    const newConv = await Conversation.create({
                        ...cleaned,
                        company1Id: newC1,
                        company2Id: newC2,
                        postId: newPostId
                    });
                    conversationIdMap.set(oldId, newConv._id.toString());
                }
            } catch (err: any) {
                console.error(`⚠️ Failed to migrate conversation:`, err.message);
            }
        }
        
        console.log('📩 Migrating Messages...');
        const messagesData = await db.select().from(schema.messages);
        if (messagesData.length > 0) {
            for (const m of messagesData) {
                try {
                    const { id: oldId, conversationId, senderId, ...rest } = m;
                    const newConvId = conversationIdMap.get(conversationId);
                    const newSenderId = userIdMap.get(senderId);
                    
                    if (newConvId && newSenderId) {
                        const cleaned = cleanData(rest);
                        if (typeof cleaned.metadata === 'string') {
                            try { cleaned.metadata = JSON.parse(cleaned.metadata); } catch(e) {}
                        }

                        await Message.create({
                            ...cleaned,
                            conversationId: newConvId,
                            senderId: newSenderId
                        });
                    }
                } catch (err) {}
            }
            console.log(`✅ Migrated messages`);
        }
    }

    console.log('✅ Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
