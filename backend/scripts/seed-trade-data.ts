import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we reach the database correctly from backend/scripts/
const dbPath = path.resolve(__dirname, '../../comexia_v2.db');
console.log(`Connecting to database at: ${dbPath}`);

const db = new Database(dbPath);

console.log("Creating tables...");

db.exec(`
  CREATE TABLE IF NOT EXISTS trade_blocs (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT NOT NULL,
    member_countries TEXT NOT NULL,
    description TEXT,
    description_en TEXT
  );

  CREATE TABLE IF NOT EXISTS trade_news (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    title_en TEXT,
    summary TEXT,
    summary_en TEXT,
    content TEXT,
    content_en TEXT,
    source TEXT NOT NULL,
    source_url TEXT NOT NULL,
    publish_date INTEGER NOT NULL,
    type TEXT NOT NULL,
    severity TEXT DEFAULT 'low',
    affected_hs_codes TEXT,
    affected_countries TEXT,
    is_route_alert INTEGER DEFAULT 0,
    route_origin TEXT,
    route_destination TEXT,
    created_at INTEGER
  );
`);

console.log("Tables created successfully.");

// Seeding Trade Blocs
const blocs = [
  {
    code: 'MERCOSUR',
    name: 'Mercado Común del Sur',
    name_en: 'Southern Common Market',
    member_countries: JSON.stringify(['AR', 'BR', 'PY', 'UY', 'BO']),
    description: 'Bloque comercial sudamericano.',
    description_en: 'South American trade bloc.'
  },
  {
    code: 'EU',
    name: 'Unión Europea',
    name_en: 'European Union',
    member_countries: JSON.stringify(['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'PL', 'AT']), // simplified
    description: 'Unidad económica y política europea.',
    description_en: 'European economic and political union.'
  },
  {
    code: 'USMCA',
    name: 'T-MEC',
    name_en: 'USMCA',
    member_countries: JSON.stringify(['US', 'CA', 'MX']),
    description: 'Tratado entre México, Estados Unidos y Canadá.',
    description_en: 'United States-Mexico-Canada Agreement.'
  },
  {
    code: 'ASEAN',
    name: 'ASEAN',
    name_en: 'ASEAN',
    member_countries: JSON.stringify(['ID', 'MY', 'PH', 'SG', 'TH', 'VN']), // simplified
    description: 'Asociación de Naciones del Sudeste Asiático.',
    description_en: 'Association of Southeast Asian Nations.'
  }
];

const insertBloc = db.prepare(`
  INSERT OR REPLACE INTO trade_blocs 
  (code, name, name_en, member_countries, description, description_en)
  VALUES (?, ?, ?, ?, ?, ?)
`);

db.transaction(() => {
  for (const bloc of blocs) {
    insertBloc.run(
      bloc.code, 
      bloc.name, 
      bloc.name_en, 
      bloc.member_countries, 
      bloc.description, 
      bloc.description_en
    );
  }
})();

console.log(`Seeded ${blocs.length} trade blocs.`);

// Seeding Initial Dummy News
const newsItems = [
  {
    id: 'news-1',
    title: 'Nuevas regulaciones ambientales para importación de madera',
    title_en: 'New environmental regulations for wood imports',
    summary: 'La UE endurece los controles contra la deforestación.',
    summary_en: 'The EU tightens controls against deforestation.',
    content: 'A partir de 2026, todas las importaciones de madera deberán certificar origen libre de deforestación...',
    content_en: 'Starting 2026, all wood imports must certify deforestation-free origin...',
    source: 'EUR-Lex',
    source_url: 'https://eur-lex.europa.eu',
    publish_date: new Date().getTime(),
    type: 'regulation',
    severity: 'critical',
    affected_hs_codes: JSON.stringify(['44']), // Chapter 44
    affected_countries: JSON.stringify(['EU', 'BR', 'AR']),
    is_route_alert: 1,
    route_origin: null,
    route_destination: 'EU',
    created_at: new Date().getTime()
  },
  {
    id: 'news-2',
    title: 'Tratado MERCOSUR-Singapur finalmente ratificado',
    title_en: 'MERCOSUR-Singapore treaty finally ratified',
    summary: 'Abre enormes oportunidades para la agroindustria.',
    summary_en: 'Opens huge opportunities for agro-industry.',
    content: 'Singapur actuará como hub logístico y financiero para las exportaciones sudamericanas a Asia.',
    content_en: 'Singapore will act as a logistics and financial hub for South American exports to Asia.',
    source: 'Cancillería Argentina',
    source_url: 'https://cancilleria.gob.ar',
    publish_date: new Date().getTime() - (86400 * 1000 * 2), // 2 days ago
    type: 'treaty',
    severity: 'low',
    affected_hs_codes: JSON.stringify([]),
    affected_countries: JSON.stringify(['AR', 'BR', 'UY', 'PY', 'SG']),
    is_route_alert: 0,
    route_origin: 'AR',
    route_destination: 'SG',
    created_at: new Date().getTime()
  }
];

const insertNews = db.prepare(`
  INSERT OR REPLACE INTO trade_news 
  (id, title, title_en, summary, summary_en, content, content_en, source, source_url, publish_date, type, severity, affected_hs_codes, affected_countries, is_route_alert, route_origin, route_destination, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

db.transaction(() => {
  for (const item of newsItems) {
    insertNews.run(
      item.id, item.title, item.title_en, item.summary, item.summary_en, 
      item.content, item.content_en, item.source, item.source_url, 
      item.publish_date, item.type, item.severity, item.affected_hs_codes, 
      item.affected_countries, item.is_route_alert, item.route_origin, 
      item.route_destination, item.created_at
    );
  }
})();

console.log(`Seeded ${newsItems.length} news items.`);
db.close();
console.log("Database seeded successfully.");
