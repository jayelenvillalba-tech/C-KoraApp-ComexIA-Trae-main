import './config/env';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import * as authRoutes from './routes/auth';
import * as marketplaceRoutes from './routes/marketplace';
import * as chatRoutes from './routes/chat';
import documentsRouter from './routes/documents';
import aiRouter from './routes/ai';
import hsCodesRouter from './routes/hs-codes';
import newsRouter from './routes/news';
import alertsRouter from './routes/alerts';
import marketAnalysisRouter from './routes/market-analysis';
import { newsService } from './services/news-service';
import cron from 'node-cron';

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());

// Static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// MongoDB Connection
if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('✅ Connected to MongoDB Atlas'))
        .catch(err => console.error('❌ MongoDB Connection Error:', err));
} else {
    console.warn('⚠️ MONGODB_URI not found in .env');
}

// =====================
// API ROUTES
// =====================

// Auth
app.post('/api/auth/register', authRoutes.register);
app.post('/api/auth/login', authRoutes.login);
app.get('/api/auth/me', authRoutes.isAuthenticated, authRoutes.getMe);

// Marketplace
app.get('/api/marketplace/posts', marketplaceRoutes.getPosts);
app.post('/api/marketplace/posts', authRoutes.isAuthenticated, marketplaceRoutes.createPost);

// Chat
app.get('/api/chat/conversations', chatRoutes.getConversations);
app.post('/api/chat/conversations', chatRoutes.createConversation);
app.get('/api/chat/:conversationId/messages', chatRoutes.getMessages);
app.post('/api/chat/:conversationId/messages', chatRoutes.sendMessage);
app.post('/api/chat/suggestions', chatRoutes.getSuggestions);

// Documents
app.use('/api/documents', documentsRouter);

// AI / HS Code Search
app.use('/api/ai', aiRouter);

// HS Codes
app.use('/api/hs-codes', hsCodesRouter);

// News / World Trade Pulse
app.use('/api/news', newsRouter);

// Alerts (HOME PAGE TICKER)
app.use('/api/alerts', alertsRouter);

// Market Analysis (Top Buyers, Treaties, etc)
app.use('/api/market-analysis', marketAnalysisRouter);

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date()
    });
});
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date()
    });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('🔥 Server Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start Server
(async () => {
  try {
    // Setup cron job for automated news fetching (every 12 hours)
    cron.schedule('0 */12 * * *', async () => {
      console.log('[Cron] Starting automated news fetch...');
      try {
        const result = await newsService.fetchAllSources();
        console.log(`[Cron] Done. Added: ${result.added}, Skipped: ${result.skipped}, Errors: ${result.errors.length}`);
      } catch (error) {
        console.error('[Cron] Fatal error during news fetch:', error);
      }
    });
    console.log('⏰ News cron job scheduled (every 12 hours)');

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 API Routes:`);
      console.log(`   POST /api/auth/register | login`);
      console.log(`   GET  /api/marketplace/posts`);
      console.log(`   GET  /api/hs-codes/search?q=trigo`);
      console.log(`   GET  /api/ai/search?q=soja`);
      console.log(`   GET  /api/documents/required?hsCode=1001&destinationCountry=NG`);
      console.log(`   GET  /api/news`);
      console.log(`   GET  /api/alerts`);
      console.log(`   GET  /health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
