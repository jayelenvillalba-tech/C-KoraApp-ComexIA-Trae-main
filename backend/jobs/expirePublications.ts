import cron from 'node-cron';
import Database from 'better-sqlite3';
import path from 'path';
import { logger } from '../services/logger.js';

const db = new Database(path.join(process.cwd(), 'comexia_v2.db'));

export function startPublicationExpiryJob() {
  // Run daily at 2:00 AM
  cron.schedule('0 2 * * *', () => {
    try {
      const expired = db.prepare(`
        UPDATE marketplace_posts
        SET status = 'expired'
        WHERE status = 'active'
        AND created_at < (strftime('%s','now') - (30 * 24 * 60 * 60))
      `).run();
      logger.info('[expiry] Publicaciones expiradas', { count: expired.changes });
    } catch (error) {
      logger.error('[expiry] Error expiring publications', { error: (error as Error).message });
    }
  });
  logger.info('[expiry] Publication expiry job scheduled (daily 02:00)');
}
