import { initDatabase, saveDatabase, getSqliteDb } from '../db-sqlite';
import crypto from 'crypto';

console.log('=== SEED: MOTOR REGULATORIO GLOBAL (DOS CAPAS) ===');

async function main() {
  try {
    await initDatabase();
    const db = getSqliteDb();

    console.log('🏗️ CAPA 1: REGULACIONES BASE (GEO-BLOQUES)');
    
    // CAPA 1: Geo-Bloques (Expandiendo para cubrir el mundo)
    const BLOCS = {
        'MERCOSUR': {
            countries: ['AR', 'BR', 'UY', 'PY', 'BO'],
            docs: JSON.stringify([{name:"Factura Comercial", importance:"Mandatory"}, {name:"CRT/BL", importance:"Mandatory"}]),
            process: "Despacho Intra-Zona Simplificado"
        },
        'EU_27': {
            countries: ['DE','FR','IT','ES','NL','BE','SE','PL','AT','DK','FI','IE','PT','GR','CZ','HU','RO','BG','SK','HR','SI','LT','LV','EE','CY','LU','MT'],
            docs: JSON.stringify([{name:"SAD (Single Admin Document)", importance:"Mandatory"}, {name:"EORI Registration", importance:"Mandatory"}]),
            process: "Centralized Customs Clearance"
        },
        'USMCA': {
            countries: ['US', 'MX', 'CA'],
            docs: JSON.stringify([{name:"USMCA Certification", importance:"Preference"}, {name:"Electronic Manifest", importance:"Mandatory"}]),
            process: "Pre-arrival Processing (ACE/PARS)"
        },
        'ASEAN': {
            countries: ['ID','TH','SG','MY','VN','PH','MM','KH','LA','BN'],
            docs: JSON.stringify([{name:"Form D (ATIGA)", importance:"Preference"}, {name:"Customs Declaration", importance:"Mandatory"}]),
            process: "ASEAN Single Window"
        },
        'RCEP_REST': {
            countries: ['CN','JP','KR','AU','NZ'],
            docs: JSON.stringify([{name:"RCEP Origin Ref", importance:"Conditional"}, {name:"Commercial Invoice", importance:"Mandatory"}]),
            process: "Standard WTO Valuation"
        },
        'AfCFTA': { // Africa
            countries: ['ZA','EG','NG','KE','GH','MA','DZ','ET','TZ','UG','SN','CI','AO','MZ','ZW'],
            docs: JSON.stringify([{name:"AfCFTA Cert of Origin", importance:"Conditional"}, {name:"Pre-Shipment Inspection", importance:"Mandatory"}]),
            process: "Paper-based + Digital Hybrid"
        }
    };

    const insertBase = db.prepare(`
        INSERT OR REPLACE INTO country_base_requirements (id, country_code, trade_bloc, base_documents, general_customs_process)
        VALUES (?, ?, ?, ?, ?)
    `);

    let tier1Count = 0;
    db.exec('BEGIN TRANSACTION');
    for (const [blocName, data] of Object.entries(BLOCS)) {
        for (const country of data.countries) {
            insertBase.run(crypto.randomUUID(), country, blocName, data.docs, data.process);
            tier1Count++;
        }
    }
    db.exec('COMMIT');
    console.log(`✅ Capa 1 Insertada: ${tier1Count} países con Reglas Base.`);

    console.log('\n🏗️ CAPA 2: REGULACIONES ESPECÍFICAS (SECTORIALES)');
    
    // CAPA 2: SECTORIAL (Matriz Producto x Destino Clave)
    const SECTORS = [
        { hs: '02', name: 'Carne', type: 'Sanitary', reqs: ['Certificado Veterinario', 'Planta Habilitada'] },
        { hs: '10', name: 'Granos', type: 'Phytosanitary', reqs: ['Certificado Fitosanitario', 'Libre de OGM (Condicional)'] },
        { hs: '27', name: 'Petróleo', type: 'Safety', reqs: ['Certificado de Calidad API', 'Safety Data Sheet'] },
        { hs: '30', name: 'Farma', type: 'Health', reqs: ['Registro Sanitario (FDA/EMA)', 'Certificado GMP'] },
        { hs: '87', name: 'Autos', type: 'Technical', reqs: ['Homologación de Seguridad', 'Certificado de Emisiones'] }
    ];

    const TARGET_MARKETS = ['CN', 'US', 'DE', 'BR', 'IN']; // Top mercados para aplicar reglas específicas

    const insertSpecific = db.prepare(`
        INSERT OR REPLACE INTO country_requirements 
        (id, country_code, hs_code, required_documents, phytosanitary_reqs)
        VALUES (?, ?, ?, ?, ?)
    `);

    let tier2Count = 0;
    db.exec('BEGIN TRANSACTION');
    for (const sector of SECTORS) {
        for (const country of TARGET_MARKETS) {
            // Generate specific docs for this Country-Sector Combo
            const docs = JSON.stringify(sector.reqs.map(r => ({ name: r, importance: "Mandatory" })));
            const phyto = JSON.stringify([`${sector.type} Clearance Required`]);
            
            insertSpecific.run(crypto.randomUUID(), country, sector.hs, docs, phyto);
            tier2Count++;
        }
    }
    db.exec('COMMIT');
    console.log(`✅ Capa 2 Insertada: ${tier2Count} combinaciones Sector-País.`);

    saveDatabase();
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
