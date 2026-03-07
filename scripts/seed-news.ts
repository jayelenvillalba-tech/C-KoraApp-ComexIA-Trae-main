
import mongoose from 'mongoose';
import { NewsItem } from '../backend/models/NewsItem';
import dotenv from 'dotenv';
dotenv.config();

const NEWS_DATA = [
    {
        title: 'AfCFTA 2025: Phase 2 Protocol on Digital Trade',
        summary: 'The African Continental Free Trade Area enters Phase 2 with new binding protocols on digital trade, investment, and intellectual property. Mandatory e-certificates of origin will be enforced by July 2025.',
        fullUrl: 'https://au-afcfta.org/news/phase-2-digital-protocol',
        source: 'AfCFTA Secretariat',
        publishedDate: new Date('2025-11-15'),
        hsCodes: ['ALL'],
        regions: ['Africa'],
        treaties: ['AfCFTA'],
        tags: ['Digital Trade', 'E-commerce', 'Compliance'],
        type: 'critical'
    },
    {
        title: 'EU REACH Regulation Update: PFAS Restrictions',
        summary: 'European Chemicals Agency (ECHA) proposes wide-ranging restriction on per- and polyfluoroalkyl substances (PFAS). Importers of textiles, packaging, and electronics must verify compliance.',
        fullUrl: 'https://echa.europa.eu/hot-topics/perfluoroalkyl-chemicals-pfas',
        source: 'ECHA (European Union)',
        publishedDate: new Date('2026-01-10'),
        hsCodes: ['8542', '3901', '6201'], // Electronics, Plastics, Textiles
        countries: ['DE', 'FR', 'ES', 'IT'],
        laws: ['REACH'],
        tags: ['Chemicals', 'Environment', 'Ban'],
        type: 'warning'
    },
    {
        title: 'China GACC: New Registration Requirements for Food Importers',
        summary: 'General Administration of Customs China (GACC) requires all overseas food manufacturers to renew registration via the Single Window system by March 2026.',
        fullUrl: 'http://jckspaqj.customs.gov.cn/',
        source: 'GACC (China Customs)',
        publishedDate: new Date('2026-02-01'),
        hsCodes: ['1001', '0201', '2204'], // Wheat, Meat, Wine
        countries: ['CN'],
        tags: ['Food Safety', 'Registration', 'Sanitary'],
        type: 'critical'
    },
    {
        title: 'USMCA: Automotive Rules of Origin Increment',
        summary: 'Regional Value Content (RVC) requirement for passenger vehicles increases to 75% under USMCA final staging. Steel and aluminum labor value content rules also tighten.',
        fullUrl: 'https://ustr.gov/trade-agreements/free-trade-agreements/united-states-mexico-canada-agreement',
        source: 'USTR',
        publishedDate: new Date('2026-01-01'),
        hsCodes: ['8703', '8708'],
        treaties: ['USMCA'],
        countries: ['US', 'MX', 'CA'],
        tags: ['Auto', 'Tariffs', 'Rules of Origin'],
        type: 'info'
    },
    {
        title: 'Nigeria: CBS Currency Reforms Impact Import Duties',
        summary: 'Central Bank of Nigeria adjusts exchange rate calculation for import duty assessment. Importers of wheat and machinery should expect 15% valuation increase.',
        fullUrl: 'https://www.cbn.gov.ng/',
        source: 'Central Bank of Nigeria',
        publishedDate: new Date('2026-02-15'),
        hsCodes: ['1001', '8401'],
        countries: ['NG'],
        tags: ['Finance', 'Currency', 'Duties'],
        type: 'warning'
    }
];

async function seedNews() {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to Populate News...');

    for (const item of NEWS_DATA) {
        const exists = await NewsItem.findOne({ fullUrl: item.fullUrl });
        if (!exists) {
            await NewsItem.create(item);
            console.log(`Created: ${item.title}`);
        } else {
            console.log(`Skipped (Exists): ${item.title}`);
        }
    }
    
    console.log('News Seeded.');
    await mongoose.disconnect();
}

seedNews();
