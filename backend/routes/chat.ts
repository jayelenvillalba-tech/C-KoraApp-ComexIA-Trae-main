import { Router } from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { validateChatMessage } from '../middleware/sanitize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../comexia_v2.db');

export function createChatRouter() {
  const router = Router();
  const db = new Database(dbPath);

  // GET /api/chat/messages/:dealId?since=timestamp
  router.get('/messages/:dealId', (req, res) => {
    try {
      const { dealId } = req.params;
      const since = parseInt(req.query.since as string || '0', 10);
      const limit = parseInt(req.query.limit as string || '50', 10);

      let messages;
      if (since > 0) {
        messages = db.prepare(`
          SELECT * FROM chat_messages
          WHERE deal_id = ? AND created_at > ?
          ORDER BY created_at ASC
          LIMIT ?
        `).all(dealId, since, limit);
      } else {
        messages = db.prepare(`
          SELECT * FROM chat_messages
          WHERE deal_id = ?
          ORDER BY created_at DESC
          LIMIT ?
        `).all(dealId, limit);
        messages = (messages as any[]).reverse();
      }

      return res.json({ success: true, data: messages });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/chat/send
  router.post('/send', (req, res) => {
    try {
      const validation = validateChatMessage(req.body);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const { dealId, senderId, senderName, senderRole, content, messageType, metadata } = req.body;

      if (!dealId || !content || !senderId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const msgId = `msg-${randomUUID().slice(0, 8)}`;
      const timestamp = Date.now();

      db.prepare(`
        INSERT INTO chat_messages (id, deal_id, sender_id, sender_name, sender_role, content, message_type, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        msgId, dealId, senderId, senderName || 'Usuario', senderRole || 'user',
        content, messageType || 'text',
        metadata ? JSON.stringify(metadata) : null,
        timestamp
      );

      db.prepare('UPDATE deals SET updated_at = ? WHERE id = ?').run(timestamp, dealId);

      const saved = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(msgId);
      return res.json({ success: true, data: saved });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  return router;
}
