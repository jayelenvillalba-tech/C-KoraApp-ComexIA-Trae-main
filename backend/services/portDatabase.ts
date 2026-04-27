/**
 * Port Database Service — Che.Comex
 * Seed inicial: 40+ puertos/aeropuertos clave para rutas LatAm ↔ Mundo
 * Fuente: UN/LOCODE — https://unece.org/trade/uncefact/addressing/unlocode
 */

import { getSqliteDb } from '../../database/db-sqlite.js';

export interface Port {
  locode: string;
  countryCode: string;
  city: string;
  portName: string;
  portType: 'port' | 'airport' | 'road' | 'rail' | 'inland';
  latitude: number;
  longitude: number;
}

// ─── Seed data ────────────────────────────────────────────────────────────────
const MAJOR_PORTS: Port[] = [
  // ────── ARGENTINA ──────
  { locode: 'ARBUE', countryCode: 'AR', city: 'Buenos Aires', portName: 'Puerto Buenos Aires',          portType: 'port',    latitude: -34.60, longitude: -58.37 },
  { locode: 'ARROS', countryCode: 'AR', city: 'Rosario',      portName: 'Puerto Rosario',               portType: 'port',    latitude: -32.95, longitude: -60.65 },
  { locode: 'ARBHI', countryCode: 'AR', city: 'Bahía Blanca', portName: 'Puerto Bahía Blanca',          portType: 'port',    latitude: -38.73, longitude: -62.27 },
  { locode: 'AREZU', countryCode: 'AR', city: 'Zárate',       portName: 'Puerto Zárate',                portType: 'port',    latitude: -34.10, longitude: -59.03 },
  { locode: 'AREZE', countryCode: 'AR', city: 'Buenos Aires', portName: 'Aeropuerto Ezeiza (EZE)',      portType: 'airport', latitude: -34.82, longitude: -58.53 },

  // ────── BRASIL ──────
  { locode: 'BRSNT', countryCode: 'BR', city: 'Santos',       portName: 'Porto de Santos',              portType: 'port',    latitude: -23.93, longitude: -46.33 },
  { locode: 'BRRIG', countryCode: 'BR', city: 'Rio Grande',   portName: 'Porto de Rio Grande',          portType: 'port',    latitude: -32.03, longitude: -52.09 },
  { locode: 'BRREC', countryCode: 'BR', city: 'Recife',       portName: 'Porto de Suape',               portType: 'port',    latitude: -8.41,  longitude: -35.00 },
  { locode: 'BRGRU', countryCode: 'BR', city: 'Rio de Janeiro', portName: 'Porto do Rio de Janeiro',   portType: 'port',    latitude: -22.89, longitude: -43.18 },
  { locode: 'BRGIG', countryCode: 'BR', city: 'Guarulhos',    portName: 'Aeropuerto de Guarulhos (GRU)',portType: 'airport', latitude: -23.43, longitude: -46.47 },

  // ────── CHILE ──────
  { locode: 'CLVAL', countryCode: 'CL', city: 'Valparaíso',   portName: 'Puerto de Valparaíso',        portType: 'port',    latitude: -33.04, longitude: -71.62 },
  { locode: 'CLIQQ', countryCode: 'CL', city: 'Iquique',      portName: 'Puerto de Iquique',           portType: 'port',    latitude: -20.21, longitude: -70.14 },
  { locode: 'CLSCL', countryCode: 'CL', city: 'Santiago',     portName: 'Aeropuerto SCL (Arturo Merino)',portType: 'airport', latitude: -33.39, longitude: -70.79 },

  // ────── URUGUAY ──────
  { locode: 'UYMVD', countryCode: 'UY', city: 'Montevideo',   portName: 'Puerto de Montevideo',        portType: 'port',    latitude: -34.91, longitude: -56.21 },

  // ────── PERÚ ──────
  { locode: 'PECLL', countryCode: 'PE', city: 'El Callao',    portName: 'Puerto del Callao',           portType: 'port',    latitude: -12.05, longitude: -77.15 },

  // ────── COLOMBIA ──────
  { locode: 'COBUN', countryCode: 'CO', city: 'Buenaventura', portName: 'Puerto de Buenaventura',      portType: 'port',    latitude:  3.89,  longitude: -77.02 },
  { locode: 'COBAQ', countryCode: 'CO', city: 'Barranquilla', portName: 'Puerto de Barranquilla',      portType: 'port',    latitude: 10.96,  longitude: -74.83 },

  // ────── MÉXICO ──────
  { locode: 'MXLZC', countryCode: 'MX', city: 'Lázaro Cárdenas', portName: 'Puerto Lázaro Cárdenas', portType: 'port',    latitude: 17.95,  longitude: -102.20 },
  { locode: 'MXVER', countryCode: 'MX', city: 'Veracruz',    portName: 'Puerto de Veracruz',          portType: 'port',    latitude: 19.19,  longitude: -96.15 },
  { locode: 'MXMEX', countryCode: 'MX', city: 'Ciudad de México', portName: 'Aeropuerto AICM (MEX)',  portType: 'airport', latitude: 19.44,  longitude: -99.07 },

  // ────── CHINA ──────
  { locode: 'CNSHA', countryCode: 'CN', city: 'Shanghai',     portName: 'Puerto de Shanghai',          portType: 'port',    latitude: 31.23,  longitude: 121.47 },
  { locode: 'CNNGB', countryCode: 'CN', city: 'Ningbo',       portName: 'Puerto de Ningbo-Zhoushan',   portType: 'port',    latitude: 29.87,  longitude: 121.55 },
  { locode: 'CNSZX', countryCode: 'CN', city: 'Shenzhen',     portName: 'Puerto de Shenzhen',          portType: 'port',    latitude: 22.54,  longitude: 114.06 },
  { locode: 'CNQIN', countryCode: 'CN', city: 'Qingdao',      portName: 'Puerto de Qingdao',           portType: 'port',    latitude: 36.09,  longitude: 120.38 },
  { locode: 'CNPVG', countryCode: 'CN', city: 'Shanghai',     portName: 'Aeropuerto Pudong (PVG)',      portType: 'airport', latitude: 31.14,  longitude: 121.80 },

  // ────── JAPÓN ──────
  { locode: 'JPYOK', countryCode: 'JP', city: 'Yokohama',     portName: 'Puerto de Yokohama',          portType: 'port',    latitude: 35.44,  longitude: 139.65 },
  { locode: 'JPOSA', countryCode: 'JP', city: 'Osaka',        portName: 'Puerto de Osaka',             portType: 'port',    latitude: 34.66,  longitude: 135.59 },

  // ────── COREA ──────
  { locode: 'KRPUS', countryCode: 'KR', city: 'Busan',        portName: 'Puerto de Busan',             portType: 'port',    latitude: 35.10,  longitude: 129.04 },

  // ────── SINGAPUR ──────
  { locode: 'SGSIN', countryCode: 'SG', city: 'Singapore',    portName: 'Puerto de Singapur',          portType: 'port',    latitude:  1.29,  longitude: 103.85 },

  // ────── EUROPA ──────
  { locode: 'NLRTM', countryCode: 'NL', city: 'Rotterdam',    portName: 'Puerto de Rotterdam',         portType: 'port',    latitude: 51.92,  longitude:   4.48 },
  { locode: 'DEHAM', countryCode: 'DE', city: 'Hamburg',      portName: 'Puerto de Hamburgo',          portType: 'port',    latitude: 53.55,  longitude:   9.99 },
  { locode: 'ESBCN', countryCode: 'ES', city: 'Barcelona',    portName: 'Puerto de Barcelona',         portType: 'port',    latitude: 41.38,  longitude:   2.18 },
  { locode: 'ESALG', countryCode: 'ES', city: 'Algeciras',    portName: 'Puerto de Algeciras',         portType: 'port',    latitude: 36.12,  longitude:  -5.44 },
  { locode: 'ITGOA', countryCode: 'IT', city: 'Génova',       portName: 'Puerto de Génova',            portType: 'port',    latitude: 44.41,  longitude:   8.93 },
  { locode: 'BEANR', countryCode: 'BE', city: 'Antwerp',      portName: 'Puerto de Amberes',           portType: 'port',    latitude: 51.23,  longitude:   4.40 },

  // ────── ESTADOS UNIDOS ──────
  { locode: 'USLAX', countryCode: 'US', city: 'Los Angeles',  portName: 'Puerto de Los Ángeles',       portType: 'port',    latitude: 33.74,  longitude: -118.27 },
  { locode: 'USNYC', countryCode: 'US', city: 'New York',     portName: 'Puerto de Nueva York / NJ',   portType: 'port',    latitude: 40.66,  longitude: -74.04 },
  { locode: 'USHOU', countryCode: 'US', city: 'Houston',      portName: 'Puerto de Houston',           portType: 'port',    latitude: 29.72,  longitude: -95.07 },
  { locode: 'USATL', countryCode: 'US', city: 'Atlanta',      portName: 'Aeropuerto Hartsfield (ATL)', portType: 'airport', latitude: 33.64,  longitude: -84.43 },

  // ────── AFRICA / MEDIO ORIENTE ──────
  { locode: 'ZADUR', countryCode: 'ZA', city: 'Durban',       portName: 'Puerto de Durban',            portType: 'port',    latitude: -29.87, longitude:  31.03 },
  { locode: 'AEJEA', countryCode: 'AE', city: 'Dubai',        portName: 'Puerto Jebel Ali',            portType: 'port',    latitude:  24.98, longitude:  55.06 },
  { locode: 'EGPSD', countryCode: 'EG', city: 'Port Said',    portName: 'Puerto Saíd',                 portType: 'port',    latitude:  31.26, longitude:  32.28 },
  { locode: 'MAPTM', countryCode: 'MA', city: 'Tánger',       portName: 'Puerto Tanger Med',           portType: 'port',    latitude:  35.88, longitude:  -5.50 },
];

// ─── Seed function ────────────────────────────────────────────────────────────
export function seedPorts(): number {
  const db = getSqliteDb();
  if (!db) return 0;

  // Check if already seeded
  const count = (db.prepare(`SELECT COUNT(*) as c FROM ports`).get() as any)?.c ?? 0;
  if (count >= MAJOR_PORTS.length) {
    console.log(`[Ports] Already seeded (${count} ports)`);
    return count;
  }

  const stmt = db.prepare(
    `INSERT OR IGNORE INTO ports (locode, country_code, city, port_name, port_type, latitude, longitude, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
  );
  const insertAll = db.transaction((ports: Port[]) => {
    for (const p of ports) {
      stmt.run(p.locode, p.countryCode, p.city, p.portName, p.portType, p.latitude, p.longitude);
    }
  });
  insertAll(MAJOR_PORTS);

  console.log(`[Ports] Seeded ${MAJOR_PORTS.length} ports`);
  return MAJOR_PORTS.length;
}

// ─── Query helpers ────────────────────────────────────────────────────────────
export function getPortsByCountry(countryCode: string): Port[] {
  const db = getSqliteDb();
  if (!db) return [];
  return db.prepare(
    `SELECT locode, country_code as countryCode, city, port_name as portName, port_type as portType, latitude, longitude
     FROM ports WHERE country_code = ? AND is_active = 1 ORDER BY port_name`
  ).all(countryCode) as Port[];
}

export function searchPorts(query: string): Port[] {
  const db = getSqliteDb();
  if (!db) return [];
  const like = `%${query.toLowerCase()}%`;
  return db.prepare(
    `SELECT locode, country_code as countryCode, city, port_name as portName, port_type as portType, latitude, longitude
     FROM ports
     WHERE (LOWER(city) LIKE ? OR LOWER(port_name) LIKE ? OR LOWER(locode) LIKE ?)
       AND is_active = 1
     LIMIT 20`
  ).all(like, like, like) as Port[];
}

export function getPortByLocode(locode: string): Port | null {
  const db = getSqliteDb();
  if (!db) return null;
  return db.prepare(
    `SELECT locode, country_code as countryCode, city, port_name as portName, port_type as portType, latitude, longitude
     FROM ports WHERE locode = ?`
  ).get(locode.toUpperCase()) as Port | null;
}
