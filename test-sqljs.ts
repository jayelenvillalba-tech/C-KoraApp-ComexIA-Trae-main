
import initSqlJs from 'sql.js';

async function test() {
    console.log('Initializing sql.js...');
    try {
        const SQL = await initSqlJs();
        const db = new SQL.Database();
        console.log('✅ sql.js initialized successfully');
        db.run('CREATE TABLE test (id INTEGER)');
        db.run('INSERT INTO test VALUES (1)');
        const res = db.exec('SELECT * FROM test');
        console.log('Query result:', res[0].values);
    } catch (e) {
        console.error('❌ sql.js failed:', e);
    }
}

test();
