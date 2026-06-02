import { Router } from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../comexia_v2.db');

export function createDealsRouter() {
  const router = Router();
  const db = new Database(dbPath);

  // Initialize tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      publication_id TEXT,
      initiator_id TEXT NOT NULL,
      vendor_id TEXT NOT NULL,
      product TEXT NOT NULL,
      hs_code TEXT NOT NULL,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      incoterm TEXT,
      quantity REAL,
      unit TEXT,
      price_usd REAL,
      status TEXT DEFAULT 'contact',
      created_at INTEGER DEFAULT (strftime('%s','now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s','now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS deal_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      joined_at INTEGER DEFAULT (strftime('%s','now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role TEXT,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      metadata TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS deal_documents (
      id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      doc_name TEXT NOT NULL,
      doc_type TEXT,
      file_url TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_deal ON chat_messages(deal_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_deals_users ON deals(initiator_id, vendor_id);
    CREATE INDEX IF NOT EXISTS idx_participants_deal ON deal_participants(deal_id);
  `);

  // POST /api/deals/create
  router.post('/create', (req, res) => {
    try {
      const {
        publicationId, vendorId, product, hsCode, origin, destination,
        incoterm, quantity, unit, priceUsd,
        initiatorId, initiatorName, initiatorRole
      } = req.body;

      if (!vendorId || !product || !hsCode || !origin || !destination) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const dealId = `deal-${randomUUID().slice(0, 8)}`;
      const userId = initiatorId || 'user-anonymous';
      const userName = initiatorName || 'Usuario';
      const userRole = initiatorRole || 'buyer';

      // Create deal
      db.prepare(`
        INSERT INTO deals (id, publication_id, initiator_id, vendor_id, product, hs_code, origin, destination, incoterm, quantity, unit, price_usd)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(dealId, publicationId || null, userId, vendorId, product, hsCode, origin, destination, incoterm || 'FOB', quantity || null, unit || 'tn', priceUsd || null);

      // Add initiator as participant
      db.prepare(`
        INSERT INTO deal_participants (deal_id, user_id, role, name)
        VALUES (?, ?, ?, ?)
      `).run(dealId, userId, userRole, userName);

      // Insert welcome system message
      const msgId = `msg-${randomUUID().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO chat_messages (id, deal_id, sender_id, sender_name, sender_role, content, message_type)
        VALUES (?, ?, 'system', 'Sistema', 'system', ?, 'system')
      `).run(msgId, dealId, `Deal iniciado para ${product} · ${origin}→${destination}`);

      return res.json({ success: true, dealId, message: 'Deal created' });
    } catch (err: any) {
      console.error('[deals] create error:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // GET /api/deals/user/:userId  ← MUST come before /:dealId
  router.get('/user/:userId', (req, res) => {
    try {
      const { userId } = req.params;
      let deals = db.prepare(`
        SELECT d.*, dp.name as participant_name, dp.role as participant_role,
               (SELECT content FROM chat_messages WHERE deal_id = d.id ORDER BY created_at DESC LIMIT 1) as last_message,
               (SELECT created_at FROM chat_messages WHERE deal_id = d.id ORDER BY created_at DESC LIMIT 1) as last_message_at
        FROM deals d
        JOIN deal_participants dp ON dp.deal_id = d.id AND dp.user_id = ?
        ORDER BY d.updated_at DESC
      `).all(userId);

      // --- MOCK INJECTION PARA DEMO SAN LORENZO ---
      if (deals.length === 0) {
        // Deal 1: Soja (San Lorenzo -> China)
        const d1 = `deal-${randomUUID().slice(0, 8)}`;
        db.prepare('INSERT INTO deals (id, initiator_id, vendor_id, product, hs_code, origin, destination, incoterm, quantity, unit, price_usd, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .run(d1, userId, 'vendor-mock-1', 'Soja Orgánica Premium', '120190', 'AR (San Lorenzo)', 'CN', 'FOB', 10000, 'tn', 480, 'negotiation');
        db.prepare('INSERT INTO deal_participants (deal_id, user_id, role, name) VALUES (?, ?, ?, ?)').run(d1, userId, 'exporter', 'Usuario Demo');
        db.prepare('INSERT INTO chat_messages (id, deal_id, sender_id, sender_name, sender_role, content, message_type) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(`msg-${randomUUID().slice(0,8)}`, d1, 'vendor-mock-1', 'Chen Wei (Comprador)', 'buyer', 'Hola, estamos muy interesados en su carga desde San Lorenzo. ¿Tienen capacidad para despachar 10,000 tn este mes?', 'text');
        
        // Deal 2: Aceite (San Lorenzo -> Brasil)
        const d2 = `deal-${randomUUID().slice(0, 8)}`;
        db.prepare('INSERT INTO deals (id, initiator_id, vendor_id, product, hs_code, origin, destination, incoterm, quantity, unit, price_usd, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .run(d2, userId, 'vendor-mock-2', 'Aceite de Girasol Alto Oleico', '151219', 'AR (Rosario)', 'BR', 'CIF', 500, 'tn', 1100, 'contact');
        db.prepare('INSERT INTO deal_participants (deal_id, user_id, role, name) VALUES (?, ?, ?, ?)').run(d2, userId, 'exporter', 'Usuario Demo');
        db.prepare('INSERT INTO chat_messages (id, deal_id, sender_id, sender_name, sender_role, content, message_type) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(`msg-${randomUUID().slice(0,8)}`, d2, 'vendor-mock-2', 'Roberto Carlos', 'buyer', 'Precisamos de azeite de girassol urgentemente para o mercado paulista. Qual o prazo de entrega?', 'text');

        // Deal 3: Maquinaria (Alemania -> Argentina)
        const d3 = `deal-${randomUUID().slice(0, 8)}`;
        db.prepare('INSERT INTO deals (id, initiator_id, vendor_id, product, hs_code, origin, destination, incoterm, quantity, unit, price_usd, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .run(d3, userId, 'vendor-mock-3', 'Maquinaria Agrícola', '843280', 'DE', 'AR', 'DAP', 5, 'unidades', 120000, 'docs');
        db.prepare('INSERT INTO deal_participants (deal_id, user_id, role, name) VALUES (?, ?, ?, ?)').run(d3, userId, 'importer', 'Usuario Demo');
        db.prepare('INSERT INTO chat_messages (id, deal_id, sender_id, sender_name, sender_role, content, message_type) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(`msg-${randomUUID().slice(0,8)}`, d3, 'vendor-mock-3', 'Klaus Müller', 'seller', 'Guten Tag. Adjunto los certificados de origen necesarios para el ingreso a Argentina. Por favor confirme recepción.', 'text');
        db.prepare('INSERT INTO chat_messages (id, deal_id, sender_id, sender_name, sender_role, content, message_type) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(`msg-${randomUUID().slice(0,8)}`, d3, 'vendor-mock-3', 'Klaus Müller', 'seller', 'Documentos adjuntos.', 'text');

        // Re-fetch after mock injection
        deals = db.prepare(`
          SELECT d.*, dp.name as participant_name, dp.role as participant_role,
                 (SELECT content FROM chat_messages WHERE deal_id = d.id ORDER BY created_at DESC LIMIT 1) as last_message,
                 (SELECT created_at FROM chat_messages WHERE deal_id = d.id ORDER BY created_at DESC LIMIT 1) as last_message_at
          FROM deals d
          JOIN deal_participants dp ON dp.deal_id = d.id AND dp.user_id = ?
          ORDER BY d.updated_at DESC
        `).all(userId);
      }
      // ---------------------------------------------

      return res.json({ success: true, data: deals });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // GET /api/deals/:dealId
  router.get('/:dealId', (req, res) => {
    try {
      const { dealId } = req.params;
      const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(dealId);
      if (!deal) return res.status(404).json({ error: 'Deal not found' });

      const participants = db.prepare('SELECT * FROM deal_participants WHERE deal_id = ? ORDER BY joined_at ASC').all(dealId);
      const documents = db.prepare('SELECT * FROM deal_documents WHERE deal_id = ? ORDER BY created_at DESC').all(dealId);

      return res.json({ success: true, data: { ...deal as any, participants, documents } });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // PATCH /api/deals/:dealId/status
  router.patch('/:dealId/status', (req, res) => {
    try {
      const { dealId } = req.params;
      const { status, changedBy, changedByName } = req.body;

      const validStatuses = ['contact', 'docs', 'negotiation', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const deal = db.prepare('SELECT status FROM deals WHERE id = ?').get(dealId) as any;
      if (!deal) return res.status(404).json({ error: 'Deal not found' });

      db.prepare('UPDATE deals SET status = ?, updated_at = ? WHERE id = ?')
        .run(status, Date.now(), dealId);

      // Insert system message
      const statusLabels: Record<string, string> = {
        contact: 'Contacto', docs: 'Documentación', negotiation: 'Negociación', closed: 'Cerrado'
      };
      const msgId = `msg-${randomUUID().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO chat_messages (id, deal_id, sender_id, sender_name, sender_role, content, message_type)
        VALUES (?, ?, 'system', 'Sistema', 'system', ?, 'system')
      `).run(msgId, dealId, `Estado actualizado: ${statusLabels[deal.status]} → ${statusLabels[status]}`);

      return res.json({ success: true, status, dealId });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/deals/:dealId/participants
  router.post('/:dealId/participants', (req, res) => {
    try {
      const { dealId } = req.params;
      const { userId, name, role } = req.body;

      db.prepare('INSERT INTO deal_participants (deal_id, user_id, role, name) VALUES (?, ?, ?, ?)')
        .run(dealId, userId, role, name);

      // system message
      const msgId = `msg-${randomUUID().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO chat_messages (id, deal_id, sender_id, sender_name, sender_role, content, message_type)
        VALUES (?, ?, 'system', 'Sistema', 'system', ?, 'system')
      `).run(msgId, dealId, `${name} se unió al deal como ${role}`);

      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  return router;
}
