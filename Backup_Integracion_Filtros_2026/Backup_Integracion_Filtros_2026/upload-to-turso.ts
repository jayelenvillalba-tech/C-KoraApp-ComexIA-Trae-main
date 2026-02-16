// Script to upload existing data to Turso
// Since Turso CLI isn't installed, we'll create a migration script

import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import fs from 'fs';

const tursoClient = createClient({
  url: 'libsql://checomex-jayelenvillalba-tech.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjY1MjU2NzAsImlkIjoiYTEzMDJlMzYtZmYxMC00MjlmLTg3NjUtZDE2MWJiYmI5YjU0IiwicmlkIjoiZDU3MGY5YWItZjY4Mi00OWVjLWI5NzYtODY4ZGZjZmQ3NDZjIn0.CHewCIfVDYVHgcIyjm12frktygNoHR7zlg2vUq9e8HEJd6BwYjeW7Xs_Mf8YX_FOqvEMZcGfywRW6o91f13gAQ'
});

async function uploadDataToTurso() {
  try {
    console.log('🚀 Starting data upload to Turso...');
    
    // Read the local SQLite file
    const localDb = new Database('./comexia_v2.db', { readonly: true });
    
    // Get list of all tables
    const tables = localDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    
    for (const { name } of tables) {
      if (name.startsWith('sqlite_')) continue;
      
      console.log(`📊 Uploading table: ${name}`);
      
      // Get table schema
      const createTableStmt = localDb.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`).get(name);
      
      // Create table in Turso
      await tursoClient.execute(createTableStmt.sql);
      
      // Get all rows
      const rows = localDb.prepare(`SELECT * FROM ${name}`).all();
      
      if (rows.length === 0) continue;
      
      // Insert data in batches of 100
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        
        for (const row of batch) {
          const columns = Object.keys(row).join(', ');
          const placeholders = Object.keys(row).map(() => '?').join(', ');
          const values = Object.values(row);
          
          await tursoClient.execute({
            sql: `INSERT OR REPLACE INTO ${name} (${columns}) VALUES (${placeholders})`,
            args: values
          });
        }
        
        console.log(`  ✓ Uploaded ${Math.min(i + batchSize, rows.length)}/${rows.length} rows`);
      }
    }
    
    console.log('✅ Data upload complete!');
    localDb.close();
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
}

uploadDataToTurso();
