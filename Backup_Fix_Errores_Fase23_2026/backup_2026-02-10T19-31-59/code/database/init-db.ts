
import { initDatabase, saveDatabase, getSqliteDb } from './db-sqlite.js';

const createTables = [
    // HS SECTIONS
    "CREATE TABLE IF NOT EXISTS hs_sections (id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, number INTEGER NOT NULL, description TEXT NOT NULL, description_en TEXT NOT NULL, chapter_range TEXT NOT NULL)",

    // COUNTRIES
    "CREATE TABLE IF NOT EXISTS countries (code TEXT PRIMARY KEY, name TEXT NOT NULL, name_en TEXT NOT NULL, region TEXT, flag_url TEXT, currency TEXT, languages TEXT, timezone TEXT)",

    // HS CHAPTERS
    "CREATE TABLE IF NOT EXISTS hs_chapters (id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, description TEXT NOT NULL, description_en TEXT NOT NULL, section_code TEXT NOT NULL, notes TEXT, notes_en TEXT)",

    // HS PARTIDAS
    "CREATE TABLE IF NOT EXISTS hs_partidas (id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, description TEXT NOT NULL, description_en TEXT NOT NULL, chapter_code TEXT NOT NULL, tariff_rate REAL, units TEXT, keywords TEXT, notes TEXT, notes_en TEXT)",

    // HS SUBPARTIDAS
    "CREATE TABLE IF NOT EXISTS hs_subpartidas (id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, description TEXT NOT NULL, description_en TEXT NOT NULL, partida_code TEXT NOT NULL, chapter_code TEXT NOT NULL, tariff_rate REAL, special_tariff_rate REAL, units TEXT, restrictions TEXT, keywords TEXT, notes TEXT, notes_en TEXT, is_active INTEGER DEFAULT 1)",

    // MARKET DATA
    "CREATE TABLE IF NOT EXISTS market_data (id TEXT PRIMARY KEY, hs_code TEXT NOT NULL, origin_country TEXT NOT NULL, destination_country TEXT NOT NULL, year INTEGER NOT NULL, volume INTEGER, value_usd REAL, avg_price_usd REAL, active_companies INTEGER)",

    // COUNTRY OPPORTUNITIES
    "CREATE TABLE IF NOT EXISTS country_opportunities (id TEXT PRIMARY KEY, hs_code TEXT NOT NULL, country_code TEXT NOT NULL, country_name TEXT NOT NULL, opportunity_score REAL, demand_score REAL, tariff_score REAL, logistics_score REAL, risk_score REAL, trade_agreements TEXT, avg_tariff_rate REAL, import_volume_growth REAL, market_size_usd REAL, competition_level TEXT, logistics_complexity TEXT)",

    // COUNTRY REQUIREMENTS
    "CREATE TABLE IF NOT EXISTS country_requirements (id TEXT PRIMARY KEY, country_code TEXT NOT NULL, hs_code TEXT NOT NULL, required_documents TEXT, technical_standards TEXT, phytosanitary_reqs TEXT, labeling_reqs TEXT, packaging_reqs TEXT, estimated_processing_time INTEGER, additional_fees TEXT)",

    // COUNTRY BASE REQUIREMENTS
    "CREATE TABLE IF NOT EXISTS country_base_requirements (id TEXT PRIMARY KEY, country_code TEXT NOT NULL UNIQUE, trade_bloc TEXT, base_documents TEXT, general_customs_process TEXT)",

    // SHIPMENTS
    "CREATE TABLE IF NOT EXISTS shipments (id TEXT PRIMARY KEY, tracking_number TEXT NOT NULL UNIQUE, origin TEXT NOT NULL, destination TEXT NOT NULL, status TEXT NOT NULL, progress INTEGER, eta INTEGER, created_at INTEGER, company_id TEXT)",

    // CUSTOMS PROCEDURES
    "CREATE TABLE IF NOT EXISTS customs_procedures (id TEXT PRIMARY KEY, name TEXT NOT NULL, name_en TEXT NOT NULL, description TEXT NOT NULL, description_en TEXT NOT NULL, type TEXT NOT NULL, documents TEXT, country TEXT NOT NULL)",

    // TRADE ALERTS
    "CREATE TABLE IF NOT EXISTS trade_alerts (id TEXT PRIMARY KEY, title TEXT NOT NULL, title_en TEXT NOT NULL, description TEXT NOT NULL, description_en TEXT NOT NULL, type TEXT NOT NULL, severity TEXT NOT NULL, category TEXT NOT NULL, affected_countries TEXT, affected_products TEXT, impact_level REAL, confidence REAL, valid_until INTEGER, source TEXT, action_recommendation TEXT, action_recommendation_en TEXT, related_links TEXT, metadata TEXT, is_active INTEGER DEFAULT 1, created_at INTEGER, updated_at INTEGER)",

    // TRADE OPPORTUNITIES
    "CREATE TABLE IF NOT EXISTS trade_opportunities (id TEXT PRIMARY KEY, title TEXT NOT NULL, title_en TEXT NOT NULL, description TEXT NOT NULL, description_en TEXT NOT NULL, origin_country TEXT NOT NULL, target_country TEXT NOT NULL, hs_code TEXT NOT NULL, product_name TEXT NOT NULL, opportunity_value REAL, growth_projection REAL, competition_level TEXT NOT NULL, market_entry_difficulty TEXT NOT NULL, recommended_action TEXT, recommended_action_en TEXT, key_benefits TEXT, key_benefits_en TEXT, potential_risks TEXT, potential_risks_en TEXT, time_to_market INTEGER, initial_investment REAL, roi REAL, confidence_score REAL, is_active INTEGER DEFAULT 1, expires_at INTEGER, created_at INTEGER, updated_at INTEGER)",

    // MARKET INTELLIGENCE
    "CREATE TABLE IF NOT EXISTS market_intelligence (id TEXT PRIMARY KEY, title TEXT NOT NULL, title_en TEXT NOT NULL, summary TEXT NOT NULL, summary_en TEXT NOT NULL, content TEXT NOT NULL, content_en TEXT NOT NULL, type TEXT NOT NULL, region TEXT, affected_countries TEXT, affected_sectors TEXT, hs_codes_impacted TEXT, key_insights TEXT, key_insights_en TEXT, data_points TEXT, sources TEXT, reliability REAL, relevance_score REAL, published_at INTEGER, valid_until INTEGER, tags TEXT, author TEXT, is_feature INTEGER DEFAULT 0, created_at INTEGER, updated_at INTEGER)",

    // COMPANIES
    "CREATE TABLE IF NOT EXISTS companies (id TEXT PRIMARY KEY, name TEXT NOT NULL, country TEXT NOT NULL, type TEXT NOT NULL, products TEXT, verified INTEGER DEFAULT 0, contact_email TEXT, website TEXT, legal_name TEXT, tax_id TEXT, business_type TEXT, established_year INTEGER, employee_count INTEGER, annual_revenue REAL, credit_rating TEXT, risk_score REAL, payment_terms TEXT, total_transactions INTEGER, average_order_value REAL, on_time_delivery_rate REAL, certifications TEXT, sanctions INTEGER DEFAULT 0, contact_person TEXT, phone TEXT, address TEXT, coordinates TEXT, last_updated INTEGER, created_at INTEGER)",

    // USERS
    "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, company_id TEXT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT, primary_role TEXT DEFAULT 'tecnico', verified INTEGER DEFAULT 0, phone TEXT, created_at INTEGER, last_active INTEGER, FOREIGN KEY (company_id) REFERENCES companies(id))",

    // MARKETPLACE POSTS
    "CREATE TABLE IF NOT EXISTS marketplace_posts (id TEXT PRIMARY KEY, company_id TEXT NOT NULL, user_id TEXT NOT NULL, type TEXT NOT NULL, hs_code TEXT NOT NULL, product_name TEXT NOT NULL, quantity TEXT, origin_country TEXT, destination_country TEXT, deadline_days INTEGER, requirements TEXT, certifications TEXT, status TEXT DEFAULT 'active', created_at INTEGER, expires_at INTEGER, FOREIGN KEY (company_id) REFERENCES companies(id), FOREIGN KEY (user_id) REFERENCES users(id))",

    // SUBSCRIPTIONS
    "CREATE TABLE IF NOT EXISTS subscriptions (id TEXT PRIMARY KEY, company_id TEXT NOT NULL, plan_type TEXT NOT NULL, status TEXT DEFAULT 'active', max_employees INTEGER NOT NULL, current_employees INTEGER DEFAULT 0, monthly_price REAL NOT NULL, start_date INTEGER, end_date INTEGER, next_billing_date INTEGER, FOREIGN KEY (company_id) REFERENCES companies(id))",

    // CONVERSATIONS
    "CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, post_id TEXT, company_1_id TEXT NOT NULL, company_2_id TEXT NOT NULL, status TEXT DEFAULT 'active', created_at INTEGER, last_message_at INTEGER, FOREIGN KEY (post_id) REFERENCES marketplace_posts(id), FOREIGN KEY (company_1_id) REFERENCES companies(id), FOREIGN KEY (company_2_id) REFERENCES companies(id))",

    // MESSAGES
    "CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL, sender_id TEXT NOT NULL, message_type TEXT DEFAULT 'text', content TEXT, metadata TEXT, created_at INTEGER, read_at INTEGER, FOREIGN KEY (conversation_id) REFERENCES conversations(id), FOREIGN KEY (sender_id) REFERENCES users(id))",

    // CONVERSATION PARTICIPANTS
    "CREATE TABLE IF NOT EXISTS conversation_participants (id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT NOT NULL, access_level TEXT DEFAULT 'full', added_by TEXT, added_at INTEGER, is_active INTEGER DEFAULT 1, FOREIGN KEY (conversation_id) REFERENCES conversations(id), FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (added_by) REFERENCES users(id))",

    // REGULATORY RULES
    "CREATE TABLE IF NOT EXISTS regulatory_rules (id TEXT PRIMARY KEY, hs_chapter TEXT, country_code TEXT, origin_country_code TEXT, document_name TEXT NOT NULL, issuer TEXT, description TEXT, requirements TEXT, priority INTEGER DEFAULT 0, created_at INTEGER)",

    // SANCTIONS LIST
    "CREATE TABLE IF NOT EXISTS sanctions_list (id TEXT PRIMARY KEY, country_code TEXT, hs_chapter TEXT, authority TEXT NOT NULL, message TEXT NOT NULL, severity TEXT NOT NULL, updated_at INTEGER)"
];

export async function initializeTables() {
    console.log('--- Database Initialization (Production-Safe) ---');
    try {
        await initDatabase();
        const sqliteDb = getSqliteDb();
        
        if (!sqliteDb) {
            throw new Error('sqliteDb is still undefined after initDatabase()');
        }

        console.log('✅ Connected to SQLite. Ensuring schema exists...');
        
        for (const sql of createTables) {
            try {
                sqliteDb.run(sql);
            } catch (err: any) {
                console.error(`❌ Error executing SQL: ${sql.substring(0, 50)}...`, err.message);
            }
        }
        
        saveDatabase();
        console.log('✅ Database schema verified/initialized');
    } catch (error: any) {
        console.error('❌ Critical Error during database initialization:', error);
        throw error;
    }
}
