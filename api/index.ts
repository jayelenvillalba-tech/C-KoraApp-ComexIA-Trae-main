import app from '../backend/server.js';
import { initDatabase } from '../database/db.js';

// Vercel Serverless Function handler
export default async function handler(req: any, res: any) {
  try {
    // Ensure DB is initialized (Warm Start friendly)
    await initDatabase();
    // Pass request to Express app
    return app(req, res);
  } catch (error: any) {
    console.error('❌ Fatal error in Vercel handler:', error);
    return res.status(500).json({ 
      error: 'Server initialization failed', 
      details: error.message 
    });
  }
}
