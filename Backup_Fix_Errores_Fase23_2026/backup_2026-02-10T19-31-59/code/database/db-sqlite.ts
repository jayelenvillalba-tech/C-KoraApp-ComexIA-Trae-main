

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../shared/schema-sqlite.js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
config();

// Ruta al archivo de base de datos SQLite
const dbPath = process.env.SQLITE_DB_PATH || path.resolve(process.cwd(), 'comexia_v2.db');

console.log(`📁 Project Root (process.cwd): ${process.cwd()}`);
console.log(`📁 Resolved DB Path: ${dbPath}`);

let db: any;
let sqliteDb: any;

// Función para inicializar la base de datos
async function initDatabase() {
  console.log(`🔄 Initializing better-sqlite3 database...`);
  
  // better-sqlite3 crea el archivo automáticamente si no existe
  sqliteDb = new Database(dbPath, { 
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined 
  });
  
  // Configurar WAL mode para mejor performance y concurrencia
  sqliteDb.pragma('journal_mode = WAL');
  
  console.log('✅ Database connected with better-sqlite3 (auto-persistent)');
  
  db = drizzle(sqliteDb, { schema });
  return db;
}


// Función para guardar la base de datos
function saveDatabase() {
  // better-sqlite3 persiste automáticamente - no se requiere acción manual
  console.log('✅ Database auto-persisted to disk (better-sqlite3)');
}

// Función para cerrar la conexión
async function closeConnection() {
  saveDatabase();
  if (sqliteDb) {
    sqliteDb.close();
  }
};

// Función para probar la conexión
async function testConnection() {
  try {
    if (!db) {
      await initDatabase();
    }
    // Simple query to test connection
    const result = sqliteDb.exec('SELECT 1 as test');
    console.log('✅ Conexión a la base de datos SQLite exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a la base de datos:', error);
    return false;
  }
};

// Exportaciones
export function getDb() { return db; }
export function getSqliteDb() { return sqliteDb; }
export { db, sqliteDb, initDatabase, saveDatabase, closeConnection, testConnection };
