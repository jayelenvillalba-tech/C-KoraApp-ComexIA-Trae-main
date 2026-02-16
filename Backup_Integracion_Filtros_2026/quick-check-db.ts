import { initDatabase, sqliteDb } from './database/db-sqlite.js';

async function check() {
  await initDatabase();
  console.log('Querying random subpartida...');
  const res = sqliteDb.exec("SELECT code, description FROM hs_subpartidas LIMIT 1");
  if (res.length > 0 && res[0].values.length > 0) {
      console.log('HS_CODE_FOUND:' + res[0].values[0][0]);
  } else {
      console.log('No subpartidas found');
  }
}

check();
