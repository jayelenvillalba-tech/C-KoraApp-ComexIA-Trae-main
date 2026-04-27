
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

    // HS SUBPARTIDAS (Legacy)
    "CREATE TABLE IF NOT EXISTS hs_subpartidas (id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, description TEXT NOT NULL, description_en TEXT NOT NULL, partida_code TEXT NOT NULL, chapter_code TEXT NOT NULL, tariff_rate REAL, special_tariff_rate REAL, units TEXT, restrictions TEXT, keywords TEXT, notes TEXT, notes_en TEXT, is_active INTEGER DEFAULT 1)",

    // PHASE 30: HS CODES GLOBAL (Multi-Nomenclature)
    `CREATE TABLE IF NOT EXISTS hs_codes_global (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hs6 TEXT NOT NULL,
      ncm8 TEXT,
      taric10 TEXT,
      hts10 TEXT,
      ccct8 TEXT,
      desc_es TEXT NOT NULL,
      desc_en TEXT NOT NULL,
      desc_pt TEXT,
      desc_zh TEXT,
      chapter TEXT NOT NULL,
      heading TEXT NOT NULL,
      section TEXT,
      section_name TEXT,
      arancel_mercosur REAL,
      arancel_taric REAL,
      arancel_hts REAL,
      arancel_china REAL,
      hs_version TEXT DEFAULT '2022',
      is_active INTEGER DEFAULT 1,
      last_updated INTEGER DEFAULT (strftime('%s','now')),
      UNIQUE(hs6, ncm8, taric10, hts10)
    )`,
    "CREATE INDEX IF NOT EXISTS idx_hs_global_hs6 ON hs_codes_global(hs6)",
    "CREATE INDEX IF NOT EXISTS idx_hs_global_ncm8 ON hs_codes_global(ncm8)",
    "CREATE INDEX IF NOT EXISTS idx_hs_global_taric ON hs_codes_global(taric10)",
    "CREATE INDEX IF NOT EXISTS idx_hs_global_hts ON hs_codes_global(hts10)",
    "CREATE INDEX IF NOT EXISTS idx_hs_global_chapter ON hs_codes_global(chapter)",
    "CREATE INDEX IF NOT EXISTS idx_hs_global_desc_es ON hs_codes_global(desc_es)",
    "CREATE INDEX IF NOT EXISTS idx_hs_global_desc_en ON hs_codes_global(desc_en)",

    // Unified Search View
    `CREATE VIEW IF NOT EXISTS hs_search_view AS
    SELECT id, hs6, ncm8, taric10, hts10, desc_es, desc_en, desc_pt, chapter, section_name, arancel_mercosur, arancel_taric, arancel_hts
    FROM hs_codes_global WHERE is_active = 1`,

    // Data Migration from old table
    `INSERT OR IGNORE INTO hs_codes_global (hs6, ncm8, desc_es, desc_en, chapter, heading)
    SELECT SUBSTR(code, 1, 6) as hs6, CASE WHEN LENGTH(code) = 8 THEN code ELSE NULL END as ncm8, description as desc_es, COALESCE(description_en, description) as desc_en, SUBSTR(code, 1, 2) as chapter, SUBSTR(code, 1, 4) as heading
    FROM hs_subpartidas`,

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
    "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, company_id TEXT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT, primary_role TEXT DEFAULT 'tecnico', verified INTEGER DEFAULT 0, phone TEXT, created_at INTEGER, last_active INTEGER, terms_accepted_at INTEGER, terms_version TEXT, acceptance_ip TEXT, deleted_at INTEGER, FOREIGN KEY (company_id) REFERENCES companies(id))",

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

    // COMPLIANCE LOG (GDPR & Audits)
    "CREATE TABLE IF NOT EXISTS compliance_log (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL, user_id TEXT, details TEXT, ip TEXT, timestamp INTEGER DEFAULT (strftime('%s','now')))",

    // SANCTIONS LIST (OFAC / UN / EU)
    `CREATE TABLE IF NOT EXISTS sanctions_list (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_name TEXT NOT NULL,
      entity_name_normalized TEXT NOT NULL,
      country TEXT,
      list_source TEXT NOT NULL,
      sanction_type TEXT,
      updated_at INTEGER DEFAULT (strftime('%s','now'))
    )`,

    `CREATE INDEX IF NOT EXISTS idx_sanctions_name
      ON sanctions_list(entity_name_normalized)`,

    // COMTRADE CACHE (UN Comtrade API — 30 days TTL)
    `CREATE TABLE IF NOT EXISTS comtrade_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cache_key TEXT UNIQUE NOT NULL,
      data TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s','now')),
      expires_at INTEGER NOT NULL
    )`,

    // TARIFF CACHE (WTO Tariff API — 90 days TTL)
    `CREATE TABLE IF NOT EXISTS tariff_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cache_key TEXT UNIQUE NOT NULL,
      mfn_rate REAL NOT NULL,
      preferential_rate REAL,
      treaty_name TEXT,
      effective_rate REAL NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s','now')),
      expires_at INTEGER NOT NULL
    )`,

    // EXCHANGE RATE CACHE (ExchangeRate-API + DolarAPI — 1h / 15min TTL)
    `CREATE TABLE IF NOT EXISTS exchange_cache (
      currency_pair TEXT PRIMARY KEY,
      rate REAL NOT NULL,
      updated_at INTEGER DEFAULT (strftime('%s','now'))
    )`,

    // PORTS (UN/LOCODE static seed)
    `CREATE TABLE IF NOT EXISTS ports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      locode TEXT UNIQUE NOT NULL,
      country_code TEXT NOT NULL,
      city TEXT NOT NULL,
      port_name TEXT NOT NULL,
      port_type TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      is_active INTEGER DEFAULT 1
    )`,

    `CREATE INDEX IF NOT EXISTS idx_ports_country ON ports(country_code)`,
    `CREATE INDEX IF NOT EXISTS idx_ports_locode  ON ports(locode)`,
    
    // PHASE 31+32: TRADE AGREEMENTS & DOCUMENTS
    `CREATE TABLE IF NOT EXISTS trade_agreements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name_es TEXT NOT NULL,
      name_en TEXT NOT NULL,
      name_pt TEXT,
      agreement_type TEXT NOT NULL,
      status TEXT NOT NULL,
      signed_date TEXT,
      in_force_date TEXT,
      wto_rta_id TEXT,
      official_url TEXT,
      notes_es TEXT,
      notes_en TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    )`,
    `CREATE TABLE IF NOT EXISTS agreement_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agreement_code TEXT NOT NULL,
      country_code TEXT NOT NULL,
      member_since TEXT,
      is_founding_member INTEGER DEFAULT 0,
      UNIQUE(agreement_code, country_code)
    )`,
    `CREATE TABLE IF NOT EXISTS agreement_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agreement_code TEXT NOT NULL,
      importer_country TEXT NOT NULL,
      exporter_country TEXT NOT NULL,
      hs6 TEXT NOT NULL,
      preferential_rate REAL,
      mfn_rate REAL,
      reduction_pct REAL,
      staging_category TEXT,
      elimination_year INTEGER,
      quota_tonnes REAL,
      notes TEXT,
      UNIQUE(agreement_code, importer_country, exporter_country, hs6)
    )`,
    `CREATE TABLE IF NOT EXISTS route_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      origin_country TEXT NOT NULL,
      dest_country TEXT NOT NULL,
      hs6 TEXT,
      agreement_code TEXT,
      doc_name TEXT NOT NULL,
      doc_name_en TEXT,
      doc_type TEXT NOT NULL,
      is_mandatory INTEGER NOT NULL DEFAULT 1,
      issuing_body TEXT NOT NULL,
      issuing_body_url TEXT,
      validity_days INTEGER,
      cost_usd REAL,
      processing_days INTEGER,
      confidence_level TEXT DEFAULT 'verified',
      last_verified TEXT,
      notes_es TEXT,
      notes_en TEXT,
      UNIQUE(origin_country, dest_country, COALESCE(hs6,''), COALESCE(agreement_code,''), doc_name)
    )`,
    `CREATE TABLE IF NOT EXISTS wto_rta_cache (
      cache_key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s','now')),
      expires_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS document_expiry_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      doc_name TEXT NOT NULL,
      deal_id TEXT,
      expiry_date TEXT NOT NULL,
      alerted_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_agreements_status ON trade_agreements(status)`,
    `CREATE INDEX IF NOT EXISTS idx_members_country ON agreement_members(country_code)`,
    `CREATE INDEX IF NOT EXISTS idx_rates_route ON agreement_rates(importer_country, exporter_country)`,
    `CREATE INDEX IF NOT EXISTS idx_rates_hs ON agreement_rates(hs6)`,
    `CREATE INDEX IF NOT EXISTS idx_docs_route ON route_documents(origin_country, dest_country)`,
    `CREATE INDEX IF NOT EXISTS idx_docs_hs ON route_documents(hs6)`,

    // PHASE 33B: MARITIME RISK ZONES
    `CREATE TABLE IF NOT EXISTS maritime_risk_zones (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_en TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      bounds_json TEXT NOT NULL,
      impact_json TEXT NOT NULL,
      context_es TEXT NOT NULL,
      context_en TEXT NOT NULL,
      warning_message TEXT,
      sources_json TEXT,
      active_incidents INTEGER DEFAULT 0,
      last_updated TEXT,
      disclaimer TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS maritime_incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      zone_id TEXT NOT NULL,
      title TEXT NOT NULL,
      source_url TEXT NOT NULL,
      severity TEXT DEFAULT 'medium',
      occurred_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    )`,

    // PHASE 34: DEAL PRICE HISTORY (Chat negotiations)
    `CREATE TABLE IF NOT EXISTS deal_price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_id TEXT NOT NULL,
      proposed_by TEXT NOT NULL,
      price_usd REAL NOT NULL,
      incoterm TEXT,
      status TEXT DEFAULT 'pending',
      proposed_at INTEGER DEFAULT (strftime('%s','now')),
      responded_at INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT,
      sender_role TEXT,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      metadata TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    )`,

    // PHASE 35: SUBSCRIPTIONS
    `CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      plan TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      mp_payment_id TEXT,
      mp_preference_id TEXT,
      started_at INTEGER DEFAULT (strftime('%s','now')),
      current_period_end INTEGER,
      cancelled_at INTEGER
    )`,
    `CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_chat_messages_deal ON chat_messages(deal_id)`,
    `CREATE INDEX IF NOT EXISTS idx_maritime_incidents_zone ON maritime_incidents(zone_id)`
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
