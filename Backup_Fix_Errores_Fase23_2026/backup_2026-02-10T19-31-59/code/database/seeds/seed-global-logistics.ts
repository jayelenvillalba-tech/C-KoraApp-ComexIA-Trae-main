import { initDatabase, saveDatabase, getSqliteDb } from '../db-sqlite';
import crypto from 'crypto';

console.log('=== SEED: LOGÍSTICA GLOBAL (PUERTOS & RUTAS) ===');

async function main() {
  try {
    await initDatabase();
    const db = getSqliteDb();

    // 1. Create Tables if not exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS global_ports (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE, -- UN/LOCODE e.g., CNSHA
        country_code TEXT NOT NULL,
        type TEXT DEFAULT 'Sea', -- Sea, Air, Land
        lat REAL,
        lng REAL
      );
      
      CREATE TABLE IF NOT EXISTS logistics_routes (
        id TEXT PRIMARY KEY,
        origin_port_id TEXT NOT NULL,
        destination_port_id TEXT NOT NULL,
        mode TEXT DEFAULT 'Sea',
        transit_time_days INTEGER,
        cost_per_teu REAL,
        frequency TEXT -- Weekly, Daily
      );
    `);

    // 2. Top Global Ports 
    const PORTS = [
      // ASIA
      { code: 'CNSHA', name: 'Shanghai', country: 'CN', lat: 31.23, lng: 121.47 },
      { code: 'SGSIN', name: 'Singapore', country: 'SG', lat: 1.29, lng: 103.85 },
      { code: 'CNNGB', name: 'Ningbo-Zhoushan', country: 'CN', lat: 29.86, lng: 121.52 },
      { code: 'KRPUS', name: 'Busan', country: 'KR', lat: 35.10, lng: 129.04 },
      { code: 'JPTYO', name: 'Tokyo', country: 'JP', lat: 35.68, lng: 139.76 },
      // EUROPE
      { code: 'NLRTM', name: 'Rotterdam', country: 'NL', lat: 51.92, lng: 4.47 },
      { code: 'BEANR', name: 'Antwerp', country: 'BE', lat: 51.22, lng: 4.40 },
      { code: 'DEHAM', name: 'Hamburg', country: 'DE', lat: 53.55, lng: 9.99 },
      { code: 'ESALG', name: 'Algeciras', country: 'ES', lat: 36.14, lng: -5.45 },
      // AMERICAS
      { code: 'USLAX', name: 'Los Angeles', country: 'US', lat: 33.74, lng: -118.28 },
      { code: 'USNYC', name: 'New York/NJ', country: 'US', lat: 40.71, lng: -74.00 },
      { code: 'BRSSZ', name: 'Santos', country: 'BR', lat: -23.96, lng: -46.33 },
      { code: 'PABLB', name: 'Balboa (Panama)', country: 'PA', lat: 8.96, lng: -79.57 },
      { code: 'MXMAN', name: 'Manzanillo', country: 'MX', lat: 19.05, lng: -104.33 },
      { code: 'AR BUE', name: 'Buenos Aires', country: 'AR', lat: -34.60, lng: -58.38 },
      // MIDDLE EAST / AFRICA
      { code: 'AEDXB', name: 'Jebel Ali (Dubai)', country: 'AE', lat: 25.01, lng: 55.06 },
      { code: 'MAPTM', name: 'Tanger Med', country: 'MA', lat: 35.88, lng: -5.52 },
      { code: 'ZADUR', name: 'Durban', country: 'ZA', lat: -29.85, lng: 31.02 }
    ];

    console.log(`🌍 Insertando ${PORTS.length} Puertos Principales...`);
    
    const insertPort = db.prepare(`INSERT OR REPLACE INTO global_ports (id, name, code, country_code, lat, lng) VALUES (?, ?, ?, ?, ?, ?)`);
    
    const portIdMap = new Map(); // code -> id

    db.exec('BEGIN TRANSACTION');
    for (const p of PORTS) {
        const id = crypto.randomUUID();
        insertPort.run(id, p.name, p.code, p.country, p.lat, p.lng);
        portIdMap.set(p.code, id);
    }
    db.exec('COMMIT');

    // 3. Generate Routes Matrix (Hub & Spoke Logic)
    console.log('🚢 Generando Matriz de Rutas Logísticas...');
    
    const insertRoute = db.prepare(`INSERT OR REPLACE INTO logistics_routes (id, origin_port_id, destination_port_id, transit_time_days, cost_per_teu, frequency) VALUES (?, ?, ?, ?, ?, ?)`);

    db.exec('BEGIN TRANSACTION');
    
    let routesCount = 0;
    
    // Connect Major Hubs (Asia <-> Europe <-> Americas)
    const HUBS = ['SGSIN', 'NLRTM', 'USLAX', 'AEDXB', 'PABLB'];
    
    for (const originCode of PORTS.map(p => p.code)) {
        for (const destCode of PORTS.map(p => p.code)) {
            if (originCode === destCode) continue;
            
            // Simplified Logic: 
            // - Within same continent: Short transit, low cost
            // - Inter-continental: Long transit, high cost
            // - Through Hub: Add intermediate logic (not fully simulated here, just direct links for UI)

            let days = Math.floor(Math.random() * 30) + 10;
            let cost = Math.floor(Math.random() * 2000) + 1500;
            
            // Is Hub Route?
            if (HUBS.includes(originCode) && HUBS.includes(destCode)) {
                days = Math.floor(Math.random() * 20) + 10; // Faster
                cost = Math.floor(Math.random() * 1500) + 800; // Cheaper economy of scale
            }

            // Insert Direct Route
            const id = crypto.randomUUID();
            const originId = portIdMap.get(originCode);
            const destId = portIdMap.get(destCode);
            
            if (Math.random() > 0.7) { // Only create routes for 30% of pairs to be realistic
                insertRoute.run(id, originId, destId, days, cost, 'Weekly');
                routesCount++;
            }
        }
    }
    
    db.exec('COMMIT');
    
    console.log(`✅ ${routesCount} Rutas marítimas generadas.`);
    console.log('📌 Tabla global_ports y logistics_routes listas.');

    saveDatabase();
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
