/**
 * Alerts Route - MongoDB version
 * Returns static trade alerts (avoids SQLite dependency)
 */
import express from 'express';
import { NewsItem } from '../models/NewsItem';

const router = express.Router();

// Static alerts for critical trade events (shown on home page ticker)
const staticAlerts = [
  {
    id: 'alert-1',
    title: 'Nuevas sanciones a exportación de tecnología dual-use a Rusia',
    urgency: 'high',
    type: 'sanction',
    source: 'EU Commission',
    isActive: true,
    createdAt: new Date('2026-01-15')
  },
  {
    id: 'alert-2',
    title: 'Congestión portuaria en Shanghai aumenta tiempos de tránsito (+7 días)',
    urgency: 'medium',
    type: 'logistics',
    source: 'USDA FAS',
    isActive: true,
    createdAt: new Date('2026-01-10')
  },
  {
    id: 'alert-3',
    title: 'AfCFTA Fase 2: Nuevos protocolos de comercio digital vigentes',
    urgency: 'high',
    type: 'regulatory',
    source: 'AfCFTA Secretariat',
    isActive: true,
    createdAt: new Date('2025-11-15')
  }
];

// GET /api/alerts - Fetch alerts
router.get('/', async (req, res) => {
  try {
    const { urgency, type } = req.query;

    let alerts = staticAlerts.filter(a => a.isActive);

    if (urgency) {
      alerts = alerts.filter(a => a.urgency === urgency);
    }
    if (type) {
      alerts = alerts.filter(a => a.type === type);
    }

    // Also try to get critical news from MongoDB if available
    try {
      const criticalNews = await NewsItem.find({ type: 'critical' })
        .sort({ publishedDate: -1 })
        .limit(5);
      
      const newsAlerts = criticalNews.map(n => ({
        id: n._id.toString(),
        title: n.title,
        urgency: 'high',
        type: 'regulatory',
        source: n.source,
        isActive: true,
        createdAt: n.publishedDate
      }));
      
      alerts = [...alerts, ...newsAlerts];
    } catch {
      // MongoDB news not available, use static alerts only
    }

    res.json({
      success: true,
      data: alerts
    });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
