
import mongoose from 'mongoose';
import { Country, Regulation } from '../backend/models';
import dotenv from 'dotenv';
dotenv.config();

const ME_DATA = {
    baseDocs: {
        'SA': { labeling: ['Arabic', 'Country of Origin'], documents: ['Commercial Invoice', 'Certificate of Origin', 'Bill of Lading', 'Saber System Reg'] },
        'AE': { labeling: ['Arabic/English'], documents: ['Commercial Invoice', 'Packing List', 'Certificate of Origin', 'Bill of Lading'] },
        'QA': { labeling: ['Arabic'], documents: ['Invoice', 'COO', 'Manifest'] }
    },
    transversalLaws: [
        { name: 'GCC Common Customs Law', region: 'GCC', desc: 'Unified customs tariff and procedures for Gulf Cooperation Council.' },
        { name: 'Halal Certification', region: 'ME', desc: 'Mandatory for all meat and food products claiming Halal status.' },
        { name: 'Anti-Commercial Fraud Law', region: 'SA', desc: 'Strict penalties for counterfeit goods.' }
    ],
    specificRules: [
        { hs: '0201', country: 'SA', doc: 'Halal Certificate', type: 'sanitary', desc: 'Must be from SFDA approved center.' },
        { hs: '0201', country: 'AE', doc: 'Halal Certificate', type: 'sanitary', desc: 'MOIAT requirements.' }
    ]
};

async function populateME() {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to Mongo (Middle East Injection)');

    for (const [code, data] of Object.entries(ME_DATA.baseDocs)) {
        await Country.updateOne(
            { code: code },
            { $set: { 'baseRequirements.labeling': data.labeling, 'baseRequirements.documents': data.documents } }
        );
        console.log(`Updated Base Req: ${code}`);
    }

    const gccCountries = ['SA', 'AE', 'QA', 'KW', 'OM', 'BH'];
    for (const law of ME_DATA.transversalLaws) {
        const targets = law.region === 'GCC' ? gccCountries : ['SA', 'AE', 'QA']; // Simplified for ME
        for (const target of targets) {
             // Only if country exists in our active list?
             // Since we have 193 countries, they should exist.
             const exists = await Regulation.findOne({ countryCode: target, documentName: law.name });
             if (!exists) {
                await Regulation.create({
                    countryCode: target,
                    documentName: law.name,
                    description: law.desc,
                    type: law.name.includes('GCC') ? 'trade_bloc' : 'transversal_law',
                    priority: 5,
                    requirements: 'Global/Regional Law'
                });
             }
        }
    }

    for (const rule of ME_DATA.specificRules) {
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

populateME();
