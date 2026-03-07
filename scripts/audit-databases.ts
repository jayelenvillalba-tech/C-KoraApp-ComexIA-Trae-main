
import mongoose from 'mongoose';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const SQLITE_DB = 'comexia_v2.db'; // Adjust path if needed

async function auditDatabases() {
    console.log('🔍 Starting Database Audit...\n');

    // 1. Check MongoDB Atlas
    if (MONGODB_URI) {
        try {
            await mongoose.connect(MONGODB_URI);
            console.log('✅ Connected to MongoDB Atlas');
            
            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log('\n📂 MongoDB Collections:');
            
            for (const col of collections) {
                const count = await mongoose.connection.db.collection(col.name).countDocuments();
                console.log(`- ${col.name}: ${count} docs`);
            }

        } catch (error) {
            console.error('❌ MongoDB Error:', error);
        } finally {
            await mongoose.disconnect();
        }
    } else {
        console.warn('⚠️ MONGODB_URI missing');
    }

    // 2. Check SQLite
    console.log('\n📂 SQLite Tables (comexia_v2.db):');
    try {
        const db = new Database(SQLITE_DB, { readonly: true });
        
        // List tables
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        
        for (const table of tables as any[]) {
            const count = db.prepare(`SELECT count(*) as count FROM ${table.name}`).get() as any;
            console.log(`- ${table.name}: ${count.count} rows`);
        }
        db.close();
    } catch (error) {
        console.error('❌ SQLite Error:', error.message);
    }
}

auditDatabases();
