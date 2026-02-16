/**
 * Documents API Routes
 * Endpoints for retrieving required trade documents
 */

import express from 'express';
import { getRequiredDocuments, groupDocumentsByCategory, documentsDatabase } from '../../shared/documents-data';

const router = express.Router();

/**
 * GET /api/documents/required
 * Get required documents for a specific trade route
 */
router.get('/required', (req, res) => {
  try {
    const { hsCode, originCountry, destinationCountry, incoterm, direction } = req.query;
    
    const documents = getRequiredDocuments({
      hsCode: hsCode as string,
      originCountry: originCountry as string,
      destinationCountry: destinationCountry as string,
      incoterm: incoterm as string,
      direction: direction as 'import' | 'export'
    });
    
    const grouped = groupDocumentsByCategory(documents);
    
    res.json({
      documents,
      grouped,
      total: documents.length,
      mandatory: documents.filter(d => d.mandatory).length
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
