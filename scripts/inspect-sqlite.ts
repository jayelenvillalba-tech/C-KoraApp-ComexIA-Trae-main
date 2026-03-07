
import Database from 'better-sqlite3';

const db = new Database('comexia_v2.db', { readonly: true });

function inspectTable(tableName: string) {
    console.log(`\n--- ${tableName} ---`);
    const rows = db.prepare(`SELECT * FROM ${tableName} LIMIT 3`).all();
    console.log(JSON.stringify(rows, null, 2));
}

inspectTable('regulatory_rules');
inspectTable('country_requirements');
inspectTable('country_base_requirements');
