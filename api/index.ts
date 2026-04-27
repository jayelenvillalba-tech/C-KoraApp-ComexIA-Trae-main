import app from '../backend/server-sqlite.js';
import { initDatabase } from '../database/db-sqlite.js';

// Vercel Serverless Function handler
export default async function handler(req: any, res: any) {
  try {
    await initDatabase();
    return app(req, res);
  } catch (error: any) {
    console.error('❌ Fatal error in Vercel handler:', error);
    return res.status(500).json({ 
      error: 'Server initialization failed', 
      details: error.message 
    });
  }
}
