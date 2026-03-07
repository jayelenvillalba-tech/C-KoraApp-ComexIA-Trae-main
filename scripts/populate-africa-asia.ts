
import mongoose from 'mongoose';
import { Country, Regulation } from '../backend/models';
import dotenv from 'dotenv';
dotenv.config();

const AFRICA_DATA = {
    subRegions: [
        { name: 'AfCFTA', countries: ['NG', 'ZA', 'EG', 'KE', 'GH', 'SN'], notes: 'AfCFTA phase 2 mandatory e-cert; 90% tariff free' },
        { name: 'ECOWAS', countries: ['NG', 'GH', 'SN'], notes: 'ECOWAS CET full; e-customs via SIGMAT' },
        { name: 'EAC', countries: ['KE', 'UG', 'TZ', 'RW'], notes: 'EAC single customs territory' },
        { name: 'SADC', countries: ['ZA', 'AO', 'NA'], notes: 'SADC FTA 85% free' }
    ],
    baseDocs: {
        'NG': { labeling: ['NAFDAC Reg Number', 'Manufacturing Date', 'Expiry Date'], documents: ['Form M', 'SONCAP Certificate', 'Commercial Invoice', 'Packing List'] },
        'ZA': { labeling: ['English/Official Lang', 'Origin'], documents: ['SAD 500 Declaration', 'Commercial Invoice', 'Bill of Lading'] },
        'EG': { labeling: ['Arabic Labeling'], documents: ['ACID Number (Nafeza)', 'Commercial Invoice', 'Packing List'] },
        'KE': { labeling: ['English/Swahili'], documents: ['IDF (Import Declaration Fee)', 'KEBS Certificate', 'Commercial Invoice'] }
    },
    specificRules: [
        { hs: '1001', country: 'NG', doc: 'Phytosanitary Certificate', type: 'sanitary', desc: 'NAFDAC & Quarantine Service Requirement. Wheat must be free from Trogoderma granarium.' },
        { hs: '2204', country: 'CN', doc: 'Certificate of Origin', type: 'import', desc: 'China Customs requirement for wine. Check heavy metal limits.' }, // China example mixed in
    ],
    transversalLaws: [
        { name: 'AU Model Law (Data Protection)', region: 'Africa', desc: 'Adopted in 30+ countries. Compliance required for digital trade data.' },
        { name: 'AfCFTA Protocol on Investment', region: 'Africa', desc: 'Phase 2 protocol covering investment protections.' }
    ]
};

const ASIA_DATA = {
    baseDocs: {
        'CN': { labeling: ['Chinese Language Label', 'CCC Mark if applicable'], documents: ['Customs Declaration', 'Commercial Invoice', 'Packing List', 'Sales Contract'] },
        'JP': { labeling: ['Japanese Labeling'], documents: ['Import Declaration', 'Invoice', 'Packing List'] },
        'ID': { labeling: ['Bahasa Indonesia'], documents: ['PI (Import Approval)', 'Surveyor Report (L.S)', 'Commercial Invoice'] }
    },
     transversalLaws: [
        { name: 'RCEP Agreement', region: 'Asia', desc: 'Regional Comprehensive Economic Partnership. Rules of Origin apply.' },
        { name: 'ASEAN Single Window', region: 'Asia', desc: 'Mandatory digital exchange of customs data (ATIGA Form D).' }
    ]
};

// ... Add more manual data mapping as needed from the prompt images ...

async function populateRegions() {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to Mongo');

    // 1. Populate/Update Country Base Requirements (Africa & Asia)
    const allBaseDocs = { ...AFRICA_DATA.baseDocs, ...ASIA_DATA.baseDocs };
    
    for (const [code, data] of Object.entries(allBaseDocs)) {
        // Find country by code (Assuming ISO 2 exists) (Make sure Countries are imported first!)
        // The previous migration populated 193 countries.
        
        await Country.updateOne(
            { code: code },
            { 
                $set: { 
                    'baseRequirements.labeling': data.labeling,
                    'baseRequirements.documents': data.documents
                }
            }
        );
        console.log(`Updated Base Requirements for ${code}`);
    }

    // 2. Populate Transversal Laws (As Regulations with type 'other' or 'law')
    const allLaws = [...AFRICA_DATA.transversalLaws, ...ASIA_DATA.transversalLaws];
    for (const law of allLaws) {
        // Create a "Region-wide" regulation? 
        // Our Regulation model has `countryCode`. We might need to loop countries or use a special code like 'AFRICA'?
        // The user wants them linked.
        // For now, let's link them to the key "Hub" countries mentioned.
        
        const hubs = law.region === 'Africa' ? ['NG', 'ZA', 'EG', 'KE'] : ['CN', 'JP', 'ID'];
        
        for (const hub of hubs) {
             await Regulation.create({
                countryCode: hub,
                documentName: law.name,
                description: law.desc,
                type: 'transversal_law', // Law/Treaty
                priority: 5,
                requirements: 'Transversal Law'
            });
        }
    }
    console.log(`Created Transversal Laws for Hubs.`);

    // 3. Populate Specific HS Rules
    for (const rule of AFRICA_DATA.specificRules) {
        await Regulation.create({
            countryCode: rule.country,
            hsChapter: rule.hs.substring(0, 2),
            hsCode: rule.hs, // E.g., '1001'
            documentName: rule.doc,
            description: rule.desc,
            type: rule.type as any,
            priority: 10
        });
    }
    console.log('Created Specific HS Rules.');

    await mongoose.disconnect();
}

populateRegions();
