
import mongoose from 'mongoose';
import { Country, Regulation } from '../backend/models';
import dotenv from 'dotenv';
dotenv.config();

const EUROPE_DATA = {
    baseDocs: {
        'DE': { labeling: ['German Language', 'CE Mark', 'Recycling (Grüner Punkt)'], documents: ['Commercial Invoice', 'Packing List', 'Bill of Lading', 'Customs Declaration (ATLAS)'] },
        'FR': { labeling: ['French Language', 'Triman Logo'], documents: ['Commercial Invoice', 'Packing List', 'Bill of Lading'] },
        'ES': { labeling: ['Spanish Language'], documents: ['Commercial Invoice', 'Packing List', 'Bill of Lading', 'DUA (SAD)'] },
        'IT': { labeling: ['Italian Language'], documents: ['Commercial Invoice', 'Packing List', 'Bill of Lading'] },
        'GB': { labeling: ['English Language', 'UKCA Mark'], documents: ['Commercial Invoice', 'Packing List', 'C88 (SAD)', 'EORI Number'] }
    },
    transversalLaws: [
        { name: 'GDPR (General Data Protection Regulation)', region: 'Europe', desc: 'Strict data privacy laws for all EU citizens. Compliance required for digital trade.' },
        { name: 'REACH Regulation', region: 'Europe', desc: 'Registration, Evaluation, Authorisation and Restriction of Chemicals. Applies to most goods.' },
        { name: 'EUDR (EU Deforestation Regulation)', region: 'Europe', desc: 'Mandatory due diligence for cattle, cocoa, coffee, oil palm, rubber, soya and wood.' },
        { name: 'CBAM (Carbon Border Adjustment Mechanism)', region: 'Europe', desc: 'Carbon tax on imports of steel, cement, aluminum, fertilizer, hydrogen, electricity.' }
    ],
    specificRules: [
        { hs: '2204', country: 'DE', doc: 'VI-1 Document', type: 'product', desc: 'Analysis certificate for wine imports into EU.' },
        { hs: '2204', country: 'DE', doc: 'Organic Certificate', type: 'product', desc: 'If labeled organic, must comply with EU organic regulations.' },
        { hs: '0201', country: 'FR', doc: 'Veterinary Certificate', type: 'sanitary', desc: 'Must come from EU-approved establishment.' }
    ]
};

async function populateEurope() {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to Mongo (Europe Injection)');

    // 1. Base Requirements
    for (const [code, data] of Object.entries(EUROPE_DATA.baseDocs)) {
        await Country.updateOne(
            { code: code },
            { $set: { 'baseRequirements.labeling': data.labeling, 'baseRequirements.documents': data.documents } }
        );
        console.log(`Updated Base Req: ${code}`);
    }

    // 2. Transversal Laws (EU Wide)
    // Link to key EU economies
    const euHubs = ['DE', 'FR', 'ES', 'IT', 'NL', 'BE'];
    for (const law of EUROPE_DATA.transversalLaws) {
        for (const hub of euHubs) {
            // Check if exists to avoid dupes if re-run
             const exists = await Regulation.findOne({ countryCode: hub, documentName: law.name });
             if (!exists) {
                await Regulation.create({
                    countryCode: hub,
                    documentName: law.name,
                    description: law.desc,
                    type: 'transversal_law',
                    priority: 5,
                    requirements: 'EU Regulation'
                });
             }
        }
    }
    console.log('Transversal Laws Injected.');

    // 3. Specific Rules
    for (const rule of EUROPE_DATA.specificRules) {
        await Regulation.create({
            countryCode: rule.country,
            hsChapter: rule.hs.substring(0, 2),
            hsCode: rule.hs,
            documentName: rule.doc,
            description: rule.desc,
            type: rule.type as any,
            priority: 10
        });
    }

    await mongoose.disconnect();
}

populateEurope();
