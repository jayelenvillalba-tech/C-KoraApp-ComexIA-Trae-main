import express from 'express';
import { db } from '../../database/db-sqlite';
import { hsSubpartidas, hsPartidas } from '../../shared/schema-sqlite';
import { eq, like, or, and, sql } from 'drizzle-orm';

const router = express.Router();

// Search HS codes
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string || '';
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    let conditions = [];
    if (query) {
        const searchPattern = `%${query}%`;
        conditions.push(or(
            like(hsSubpartidas.code, searchPattern),
            like(hsSubpartidas.description, searchPattern),
            like(hsSubpartidas.descriptionEn, searchPattern)
        ));
    }
    
    const results = await db.select()
        .from(hsSubpartidas)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset);
    
    const totalResult = await db.select({ count: sql<number>`count(*)` })
        .from(hsSubpartidas)
        .where(and(...conditions));

    res.json({
      success: true,
      total: totalResult[0].count,
      limit,
      offset,
      results
    });
  } catch (error: any) {
    console.error('Error searching HS codes:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error searching HS codes',
      details: error.message
    });
  }
});

// Get HS code by code
router.get('/:code', async (req, res) => {
  try {
    const code = req.params.code;
    
    // Try subpartidas first (6 digits)
    let hsCode = await db.query.hsSubpartidas.findFirst({
        where: eq(hsSubpartidas.code, code)
    });

    // If not found, try partidas (4 digits)
    if (!hsCode) {
        const partida = await db.query.hsPartidas.findFirst({
            where: eq(hsPartidas.code, code)
        });
        if (partida) {
             // Map to similar structure
             hsCode = {
                 ...partida,
                 partidaCode: '',
                 specialTariffRate: null,
                 restrictions: null,
                 isActive: true
             } as any;
        }
    }

    if (!hsCode) {
      return res.status(404).json({
        success: false,
        error: 'HS code not found'
      });
    }

    // Compatibility mapping
    const responseData = {
        ...hsCode,
        baseTariff: hsCode.tariffRate || 0,
        section: '', // TODO: Fetch from chapter -> section
        specializations: [] // TODO: Add specializations table or column
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (error: any) {
    console.error('Error getting HS code:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error getting HS code',
      details: error.message
    });
  }
});

export default router;
