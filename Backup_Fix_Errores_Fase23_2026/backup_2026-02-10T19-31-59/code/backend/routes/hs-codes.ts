
import express from 'express';
import { HSCode } from '../models/HSCode';

const router = express.Router();

// Get all chapters (2-digit codes)
router.get('/chapters', async (req, res) => {
  try {
    const chapters = await HSCode.find({ 
      code: { $regex: /^\d{2}$/ } 
    }).sort({ code: 1 });
    
    res.json(chapters);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get partidas (4-digit codes) by chapter
router.get('/partidas', async (req, res) => {
  try {
    const { chapter } = req.query;
    
    const query: any = { code: { $regex: /^\d{4}$/ } };
    if (chapter) {
      query.chapterCode = String(chapter);
    }
    
    const partidas = await HSCode.find(query).sort({ code: 1 });
    res.json(partidas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get subpartidas (6-digit codes) by partida
router.get('/subpartidas', async (req, res) => {
  try {
    const { partida } = req.query;
    
    const query: any = { code: { $regex: /^\d{6}$/ } };
    if (partida) {
      query.partidaCode = String(partida);
    }
    
    const subpartidas = await HSCode.find(query).sort({ code: 1 });
    res.json(subpartidas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Search endpoint (already exists in ai.ts but duplicating for compatibility)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });
    
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
