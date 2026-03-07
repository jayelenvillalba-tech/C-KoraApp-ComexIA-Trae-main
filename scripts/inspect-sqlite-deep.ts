
import Database from 'better-sqlite3';

const db = new Database('comexia_v2.db', { readonly: true });

function inspect() {
    console.log('--- country_base_requirements (First 2) ---');
    const base = db.prepare('SELECT * FROM country_base_requirements LIMIT 2').all();
    console.log(JSON.stringify(base, null, 2));

    console.log('\n--- country_requirements (First 2) ---');
    const reqs = db.prepare('SELECT * FROM country_requirements LIMIT 2').all();
    console.log(JSON.stringify(reqs, null, 2));
}

inspect();
