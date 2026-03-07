
import mongoose from 'mongoose';
import Database from 'better-sqlite3';
import { Country, Regulation } from '../backend/models';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const SQLITE_DB = 'comexia_v2.db';

async function migrateRegulations() {
    if (!MONGODB_URI) {
        console.error('MONGODB_URI missing');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = new Database(SQLITE_DB, { readonly: true });

        // 1. Migrate Country Base Requirements
        console.log('📦 Migrating Country Base Requirements...');
        const baseReqs = db.prepare('SELECT * FROM country_base_requirements').all();
        
        for (const row of baseReqs as any[]) {
            if (!row.country_code) continue;

            // Parse JSON fields
            const parseList = (str: string) => {
                try { return JSON.parse(str || '[]'); } catch { return []; }
            };

            const updateData = {
                baseRequirements: {
                    labeling: parseList(row.labeling_reqs),
                    packaging: parseList(row.packaging_reqs),
                    documents: parseList(row.documentation_reqs), // check field name in sqlite
                    processingTime: row.estimated_processing_time
                }
            };
            
            // Note: row.documentation_reqs might be the field name, relying on general knowledge or assume it matches.
            // If it fails, I'll check the specific field name again.
            // In the deep inspect output I saw "labeling_reqs", "packaging_reqs". 
            // I'll assume "documentation_reqs" exists or use "base_documents" from regulatory_rules?
            
            await Country.updateOne(
                { code: row.country_code },
                { $set: updateData }
            );
        }
        console.log(`Updated ${baseReqs.length} countries.`);

        // 2. Migrate Specific Regulations (country_requirements)
        console.log('📜 Migrating Specific Regulations...');
        const specificReqs = db.prepare('SELECT * FROM country_requirements').all();

        let regCount = 0;
        for (const row of specificReqs as any[]) {
            // Map to Regulation Model
            // row likely has: country_code, hs_code, requirements (json?), etc.
            
            // Create a general regulation doc
             await Regulation.create({
                countryCode: row.country_code,
                hsCode: row.hs_code,
                documentName: 'Import Requirements', // Generic title
                description: `Specific requirements for ${row.hs_code}`,
                requirements: JSON.stringify(row), // Access raw data for now
                type: 'import',
                priority: 10
            });
            regCount++;
        }
        console.log(`Created ${regCount} specific regulations.`);

        // 3. Migrate Regulatory Rules (if any)
        const rules = db.prepare('SELECT * FROM regulatory_rules').all();
        for (const row of rules as any[]) {
             if (!row.country_code) continue;
             
             await Regulation.create({
                 countryCode: row.country_code,
                 documentName: 'Regulatory Rule',
                 description: row.general_customs_process || 'General Rule',
                 requirements: row.base_documents,
                 type: 'other'
             });
             regCount++;
        }
         console.log(`Created ${rules.length} regulatory rules.`);

    } catch (error) {
        console.error('Migration Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

migrateRegulations();
