
import express from 'express';
import { classifyProductHS } from '../services/ai-hs-classifier';
import { HSCode } from '../models/HSCode';

const router = express.Router();

router.post('/classify', async (req, res) => {
  try {
    const { description, originCountry, context } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }
    
    const result = await classifyProductHS(description, originCountry, context);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });
    
    // Quick DB textual search first
    const results = await HSCode.find(
      { $text: { $search: String(q) } },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .limit(10);
    
    res.json({ results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
