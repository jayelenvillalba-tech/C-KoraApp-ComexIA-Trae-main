/**
 * Documents API Routes
 * Endpoints for retrieving required trade documents
 */

import express from 'express';
import { getRequiredDocuments, groupDocumentsByCategory, documentsDatabase } from '../../shared/documents-data';
import { Country, Regulation } from '../models';

const router = express.Router();

/**
 * GET /api/documents/required
 * Get required documents for a specific trade route
 */
router.get('/required', async (req, res) => {
  try {
    const { hsCode, originCountry, destinationCountry, incoterm, direction } = req.query;
    
    // 1. Get Static Requirements (Base Catalog)
    const staticDocs = getRequiredDocuments({
      hsCode: hsCode as string,
      originCountry: originCountry as string,
      destinationCountry: destinationCountry as string,
      incoterm: incoterm as string,
      direction: direction as 'import' | 'export'
    });

    // 2. Fetch Dynamic Requirements from MongoDB
    // Determine target country code based on direction
    const targetCountryCode = direction === 'export' ? destinationCountry : originCountry;
    
    let dbDocs: any[] = [];
    
    if (targetCountryCode) {
        // A. Country Base Requirements
        const country = await Country.findOne({ code: targetCountryCode as string });
        
        // B. Specific HS Code Regulations
        const rules = await Regulation.find({
            countryCode: targetCountryCode as string,
            $or: [
                { hsCode: hsCode as string }, // Exact match
                { hsChapter: (hsCode as string)?.substring(0, 2) } // Chapter match
            ]
        });

        // Convert DB Rules to Document Format
        const dynamicDocs = rules.map(r => ({
            id: `reg-${r._id}`,
            name: r.documentName,
            nameEs: r.documentName, // Fallback
            category: r.type === 'sanitary' ? 'product' : 'customs',
            description: r.description || r.requirements || 'Specific regulation',
            descriptionEs: r.description || r.requirements || 'Regulación específica',
            requiredFor: { direction: 'both' }, // Assume both for now
            managementLinks: {},
            mandatory: true,
            status: 'mandatory',
            source: 'database' // Tag as DB sourced
        }));
        
        dbDocs = [...dynamicDocs];

        // Process Country Base Requirements if needed
        // (For now, we assume staticDocs covers standard things like Invoice, but we could enforce from DB)
    }

    // 3. Merge Documents (Static + Dynamic)
    const allDocs = [...staticDocs, ...dbDocs];

    const grouped = groupDocumentsByCategory(allDocs as any); // Cast as any because of dynamic fields
    
    res.json({
      documents: allDocs,
      grouped,
      total: allDocs.length,
      mandatory: allDocs.filter(d => d.mandatory).length,
      source: 'hybrid' // Indicate data comes from mixed sources
    });
  } catch (error: any) {
    console.error('Error fetching required documents:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/documents/all
 * Get all available documents
 */
router.get('/all', (req, res) => {
  try {
    const grouped = groupDocumentsByCategory(documentsDatabase);
    
    res.json({
      documents: documentsDatabase,
      grouped,
      total: documentsDatabase.length
    });
  } catch (error: any) {
    console.error('Error fetching all documents:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/documents/:id
 * Get specific document details
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const document = documentsDatabase.find(d => d.id === id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(document);
  } catch (error: any) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
