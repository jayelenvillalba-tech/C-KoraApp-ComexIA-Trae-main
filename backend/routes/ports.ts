/**
 * Ports Routes — Che.Comex
 * GET /api/ports           — List ports (optionally filter by country)
 * GET /api/ports/search    — Search by name or LOCODE
 * GET /api/ports/:locode   — Get single port by LOCODE
 */

import { Router, Request, Response } from 'express';
import { getPortsByCountry, searchPorts, getPortByLocode, seedPorts } from '../services/portDatabase.js';

const router = Router();

// Seed on first import
seedPorts();

// GET /api/ports?country=AR
router.get('/', (req: Request, res: Response) => {
  const country = (req.query.country as string)?.toUpperCase();
  const ports = country ? getPortsByCountry(country) : getPortsByCountry('AR');
  return res.json({ success: true, total: ports.length, data: ports, source: 'UN/LOCODE' });
});

// GET /api/ports/search?q=buenos
router.get('/search', (req: Request, res: Response) => {
  const q = (req.query.q as string) || '';
  if (q.length < 2) return res.json({ success: true, total: 0, data: [] });
  const ports = searchPorts(q);
  return res.json({ success: true, total: ports.length, data: ports, source: 'UN/LOCODE' });
});

// GET /api/ports/:locode
router.get('/:locode', (req: Request, res: Response) => {
  const port = getPortByLocode(req.params.locode);
  if (!port) return res.status(404).json({ success: false, error: 'Port not found' });
  return res.json({ success: true, data: port, source: 'UN/LOCODE' });
});

export default router;
