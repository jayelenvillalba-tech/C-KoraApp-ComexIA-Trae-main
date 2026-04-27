import { Router } from 'express';
import { db } from '../../database/db-sqlite'; // Adjust path if needed
import { feedbackReports } from '../../shared/schema-sqlite';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { desc, eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Logger for fallback email
function logEmailFallback(subject: string, body: string) {
  try {
    const logPath = path.resolve(process.cwd(), 'logs/feedback-emails.log');
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logEntry = `[${new Date().toISOString()}] EMAIL SENT\nSubject: ${subject}\nBody: ${body}\n---------------------------\n`;
    fs.appendFileSync(logPath, logEntry);
    console.log(`[Feedback] Notificación guardada en logs: ${subject}`);
  } catch (error) {
    console.error(`[Feedback] Error guardando log de email:`, error);
  }
}

// Minimal Auth Middleware (assuming JWT_SECRET is available)
const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_key_123';
const authenticateToken = (req: any, res: any, next: any) => {
  console.log('[AUTH] Validando token para:', req.method, req.originalUrl);
  console.log('[AUTH] Headers recibidos:', req.headers);
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.warn('[AUTH] No token provisto. Retornando 401.');
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.warn('[AUTH] Token inválido o expirado. Retornando 403.', err.message);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

export function createFeedbackRouter() {
  const router = Router();

  // Rate Limiter: 5 por hora
  const feedbackLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5,
    message: { error: 'Demasiados reportes. Esperá una hora.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  router.post('/', authenticateToken, feedbackLimiter, async (req: any, res: any) => {
    console.log('[FEEDBACK] POST recibido');
    console.log('[FEEDBACK] Headers:', req.headers);
    console.log('[FEEDBACK] Body Type:', typeof req.body);
    console.log('[FEEDBACK] Body Keys:', req.body ? Object.keys(req.body) : 'No body');
    console.log('[FEEDBACK] Body string length:', JSON.stringify(req.body || {}).length);
    
    try {
      const { type, module, description, severity, screenshotData, pageUrl, userAgent } = req.body;
      const userId = req.user.userId || req.user.id;
      // Extract companyId safely. If the user payload has it, use it, else try to get it, or null
      const companyId = req.user.companyId || null;

      if (!type || !module || !description || !severity) {
        return res.status(400).json({ error: 'Faltan campos requeridos (type, module, description, severity)' });
      }

      // Generar ID único
      const reportId = `REP-${Date.now()}`;

      // Insertar en base de datos usando Drizzle
      await db.insert(feedbackReports).values({
        reportId,
        type,
        module,
        description,
        severity,
        screenshotData: screenshotData || null,
        metadata: JSON.stringify({ pageUrl, userAgent, timestamp: new Date() }),
        userId,
        companyId,
        status: 'received',
      });

      // Intentar enviar email (Simulado con logger por ahora)
      const subject = `[Che.Comex] Nuevo reporte #${reportId} - ${severity.toUpperCase()}`;
      const body = `Tipo: ${type}\nMódulo: ${module}\nSeveridad: ${severity}\nUsuario: ${userId}\nDescripción: ${description}`;

      if (process.env.SENDGRID_API_KEY) {
        // Acá iría la lógica real de SendGrid
        // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        // sgMail.send({...})
        logEmailFallback(subject, body + '\n(Simulado: Sendgrid Key existe pero no implementado en MVP)');
      } else {
        logEmailFallback(subject, body);
      }

      return res.status(201).json({ reportId, message: `Reporte #${reportId} recibido` });
    } catch (error: any) {
      console.error('[Feedback] Error saving report:', error);
      return res.status(500).json({ error: 'Error interno del servidor al procesar el reporte' });
    }
  });

  router.get('/my-reports', authenticateToken, async (req: any, res: any) => {
    try {
      const userId = req.user.userId || req.user.id;
      
      const reports = await db
        .select()
        .from(feedbackReports)
        .where(eq(feedbackReports.userId, userId))
        .orderBy(desc(feedbackReports.createdAt));

      // Parse metadata for convenience in frontend
      const formattedReports = reports.map(r => ({
        ...r,
        metadata: r.metadata ? JSON.parse(r.metadata) : null
      }));

      return res.json(formattedReports);
    } catch (error: any) {
      console.error('[Feedback] Error fetching reports:', error);
      return res.status(500).json({ error: 'Error interno del servidor al obtener el historial' });
    }
  });

  return router;
}
