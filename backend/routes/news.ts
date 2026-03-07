
import express from 'express';
import { NewsItem } from '../models/NewsItem';

const router = express.Router();

// GET /api/news - Fetch news with filters
router.get('/', async (req, res) => {
    try {
        const { 
            hsCode, 
            country, 
            treaty, 
            type, 
            search,
            limit = '20',
            page = '1'
        } = req.query;

        const query: any = {};

        if (hsCode) query.hsCodes = hsCode; // Exact match or $in if we parse array
        if (country) query.countries = country;
        if (treaty) query.treaties = treaty;
        if (type) query.type = type;

        if (search) {
            query.$text = { $search: search as string };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const news = await NewsItem.find(query)
            .sort({ publishedDate: -1 })
            .limit(Number(limit))
            .skip(skip);

        const total = await NewsItem.countDocuments(query);

        res.json({
            news,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit))
        });
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// GET /api/news/latest - Quick summary for dashboard
router.get('/latest', async (req, res) => {
    try {
        const news = await NewsItem.find().sort({ publishedDate: -1 }).limit(5);
        res.json(news);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch latest news' });
    }
});

// POST /api/news/seed (Dev/Admin only)
router.post('/seed', async (req, res) => {
    try {
         // Logic mainly handles via scripts, but API endpoint for triggering
         res.json({ message: 'Use the seed script instead.' });
    } catch (error) {
        res.status(500).json({ error: 'Seed failed' });
    }
});

export default router;
