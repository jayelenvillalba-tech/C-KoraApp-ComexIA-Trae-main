
import Database from 'better-sqlite3';
import path from 'path';

const db1Path = path.join(process.cwd(), 'comexia_v2_failed_attempt.db'); // The 28MB broken one
const db2Path = path.join(process.cwd(), 'comexia_v2.db'); // The 42MB working one

console.log('Comparing schemas...');
console.log(`DB 1 (Failed): ${db1Path}`);
console.log(`DB 2 (Working): ${db2Path}`);

function getSchema(dbPath) {
    try {
        const db = new Database(dbPath, { readonly: true });
        const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name").all();
        db.close();
        return tables.reduce((acc, t) => {
            acc[t.name] = t.sql;
            return acc;
        }, {});
    } catch (e) {
        return null;
    }
}

const schema1 = getSchema(db1Path);
const schema2 = getSchema(db2Path);

if (!schema1 || !schema2) {
    console.error('Could not open one of the databases.');
    process.exit(1);
}

const tables1 = Object.keys(schema1);
const tables2 = Object.keys(schema2);

const allTables = new Set([...tables1, ...tables2]);

console.log('\n--- Table Differences ---');
for (const table of allTables) {
    if (!schema1[table]) {
        console.log(`[+] Table '${table}' exists ONLY in Working DB (42MB)`);
    } else if (!schema2[table]) {
        console.log(`[-] Table '${table}' exists ONLY in Failed DB (28MB)`);
    } else if (schema1[table] !== schema2[table]) {
        console.log(`[*] Table '${table}' has schema MISMATCH`);
        // console.log(`    Failed:  ${schema1[table].replace(/\n/g, ' ')}`);
        // console.log(`    Working: ${schema2[table].replace(/\n/g, ' ')}`);
    }
}
