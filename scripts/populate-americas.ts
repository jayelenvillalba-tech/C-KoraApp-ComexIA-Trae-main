
import mongoose from 'mongoose';
import { Country, Regulation } from '../backend/models';
import dotenv from 'dotenv';
dotenv.config();

const AMERICAS_DATA = {
    baseDocs: {
        'US': { labeling: ['English', 'Country of Origin', 'Made in USA rules'], documents: ['Commercial Invoice', 'Packing List', 'Bill of Lading', 'ISF (10+2) Filing', 'Customs Bond'] },
        'CA': { labeling: ['English/French'], documents: ['Canada Customs Invoice (CCI)', 'Bill of Lading', 'Manifest'] },
        'MX': { labeling: ['Spanish', 'NOM Standards'], documents: ['Pedimento', 'Factura Comercial', 'Packing List', 'Certificado de Origen'] },
        'PA': { labeling: ['Spanish'], documents: ['Commercial Invoice', 'Bill of Lading', 'Certificate of Origin'] }
    },
    transversalLaws: [
        { name: 'USMCA (US-Mexico-Canada Agreement)', region: 'North America', desc: 'Free trade agreement replacing NAFTA. Specific Rules of Origin apply.' },
        { name: 'FSMA (Food Safety Modernization Act)', region: 'US', desc: 'Major reform of food safety laws. Requires FSVP for importers.' },
        { name: 'CCPA (California Consumer Privacy Act)', region: 'US', desc: 'Data privacy rights for California residents.' }
    ],
    specificRules: [
        { hs: '0201', country: 'US', doc: 'FSIS Inspection', type: 'sanitary', desc: 'Meat must be inspected by USDA FSIS.' },
        { hs: '0201', country: 'MX', doc: 'Certificado Zoosanitario', type: 'sanitary', desc: 'Issued by SENASICA.' },
        { hs: '0901', country: 'US', doc: 'FDA Prior Notice', type: 'sanitary', desc: 'Required for all food imports.' }
    ]
};

async function populateAmericas() {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to Mongo (Americas Injection)');

    for (const [code, data] of Object.entries(AMERICAS_DATA.baseDocs)) {
        await Country.updateOne(
            { code: code },
            { $set: { 'baseRequirements.labeling': data.labeling, 'baseRequirements.documents': data.documents } }
        );
        console.log(`Updated Base Req: ${code}`);
    }

    const usmcaCountries = ['US', 'CA', 'MX'];
    for (const law of AMERICAS_DATA.transversalLaws) {
        const targets = law.region === 'North America' ? usmcaCountries : ['US'];
        for (const target of targets) {
            const exists = await Regulation.findOne({ countryCode: target, documentName: law.name });
            if (!exists) {
                await Regulation.create({
                    countryCode: target,
                    documentName: law.name,
                    description: law.desc,
                    type: law.name.includes('USMCA') ? 'trade_bloc' : 'transversal_law',
                    priority: 5,
                    requirements: 'Regional Law'
                });
            }
        }
    }

    for (const rule of AMERICAS_DATA.specificRules) {
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

populateAmericas();
