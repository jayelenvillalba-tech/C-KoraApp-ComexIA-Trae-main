
import { db, initDatabase } from './database/db-sqlite.js';
import { regulatoryRules } from './shared/schema-sqlite.js';
import { and, eq, or } from 'drizzle-orm';

async function testQuery() {
    try {
        await initDatabase();
        console.log("Testing Regulatory Docs Query...");
        const countryStr = 'CN';
        const hsCodeStr = '1201';
        const chapter = hsCodeStr.substring(0, 2); // "12"

        console.log(`Searching for: Country=${countryStr}, Chapter=${chapter}`);

        // Logic from server-sqlite.ts
        const docs = await db.select().from(regulatoryRules)
            .where(and(
                eq(regulatoryRules.countryCode, countryStr),
                or(
                    eq(regulatoryRules.hsChapter, chapter),
                    eq(regulatoryRules.hsChapter, hsCodeStr)
                )
            ));

        console.log(`Found ${docs.length} documents.`);
        docs.forEach(d => {
            console.log(`- [${d.documentName}] Issuer: ${d.issuer}`);
        });
        
        if (docs.length > 0) console.log("✅ Validation SUCCESS");
        else console.log("❌ Validation FAILED: No docs found");

    } catch (e) {
        console.error("Error:", e);
    }
}

testQuery();
