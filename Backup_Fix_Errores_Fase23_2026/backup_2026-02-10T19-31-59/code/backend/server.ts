import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import * as authRoutes from './routes/auth';
import * as marketplaceRoutes from './routes/marketplace';
import * as chatRoutes from './routes/chat'; // Import Chat Routes
import documentsRouter from './routes/documents'; // Check if this needs refactoring!
// Documents route usually reads static JSON or DB.
// RequiredDocuments in Phase 22 was reading from 'shared/documents-data.ts' (static file).
// So it might not need DB refactoring yet, unless it uses SQLite for something else.
// Checking imports later.

import aiRouter from './routes/ai';
import hsCodesRouter from './routes/hs-codes';

// Configuration
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('✅ Connected to MongoDB Atlas'))
        .catch(err => console.error('❌ MongoDB Connection Error:', err));
} else {
    console.warn('⚠️ MONGODB_URI not found in .env');
}

// Static files for uploaded photos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
// Auth
app.post('/api/auth/register', authRoutes.register);
app.post('/api/auth/login', authRoutes.login);
app.get('/api/auth/me', authRoutes.isAuthenticated, authRoutes.getMe);

// Marketplace
app.get('/api/marketplace/posts', marketplaceRoutes.getPosts);
app.post('/api/marketplace/posts', authRoutes.isAuthenticated, marketplaceRoutes.createPost); // Protected

// Chat
app.get('/api/chat/conversations', chatRoutes.getConversations);
app.post('/api/chat/conversations', chatRoutes.createConversation);
app.get('/api/chat/:conversationId/messages', chatRoutes.getMessages);
app.post('/api/chat/:conversationId/messages', chatRoutes.sendMessage);
app.post('/api/chat/suggestions', chatRoutes.getSuggestions);

// Uploads logic? Usually in a separate route or inside createPost with multer.
// For now keeping simple.

// Documents
app.use('/api/documents', documentsRouter);

// AI
app.use('/api/ai', aiRouter);

// HS Codes
app.use('/api/hs-codes', hsCodesRouter);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date()
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 API Routes ready`);
});
