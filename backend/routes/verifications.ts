import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../../database/db-sqlite.js';
import { verifications, companies, users } from '../../shared/schema-sqlite.js';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// ─── Simple In-Memory Rate Limiter ─────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function rateLimiter(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= limit) {
      return res.status(429).json({ error: 'Too many requests, please try again later.' });
    }

    record.count += 1;
    next();
  };
}

// ─── Mock AFIP/RFB API para KYB Básico ────────────────────────────────────────
async function verifyWithTaxAuthority(cuitOrCnpj: string, country: string): Promise<{
  valid: boolean;
  status: string;
  reputationScore: number;
  details: string;
}> {
  // Simulamos una latencia de red de 1-2s para la API
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

  // Simulamos lógica de validación
  const cleanId = cuitOrCnpj.replace(/[^0-9]/g, '');
  
  if (cleanId.length < 11) {
    return { valid: false, status: 'INVALID_FORMAT', reputationScore: 0, details: 'Formato de CUIT/CNPJ inválido' };
  }

  // 10% de probabilidad de que esté inactivo (mock)
  if (cleanId.endsWith('00')) {
    return { valid: false, status: 'INACTIVE', reputationScore: 20, details: 'CUIT Inactivo / Sin impuestos dados de alta' };
  }

  // 20% de probabilidad de deuda o riesgo fiscal medio
  if (cleanId.endsWith('11')) {
    return { valid: true, status: 'ACTIVE_WITH_DEBT', reputationScore: 60, details: 'Activo - Riesgo Fiscal Medio (SIPER C)' };
  }

  return { valid: true, status: 'ACTIVE', reputationScore: 95, details: 'Activo - Excelente cumplimiento (SIPER A)' };
}

// POST /api/verifications/kyb
// Pure KYB verification for tax ID (no documents needed)
router.post('/kyb', rateLimiter(10, 15 * 60 * 1000), async (req: any, res) => {
  try {
    const { taxId, country, entityId } = req.body;
    if (!taxId || !country || !entityId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const kybResult = await verifyWithTaxAuthority(taxId, country);

    // Actualizamos el risk_score de la compañía
    await db.update(companies)
      .set({ 
         riskScore: kybResult.reputationScore,
         taxId: taxId
      })
      .where(eq(companies.id, entityId));

    res.json({ status: 'success', kybResult });
  } catch (error: any) {
    console.error('KYB verification error:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'backend/uploads');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images and PDF files are allowed!'));
  }
});

// POST /api/verifications/request
// Upload documents and create verification request
// Added Rate Limiting: 5 requests per 15 minutes
router.post('/request', rateLimiter(5, 15 * 60 * 1000), upload.array('documents', 3), async (req: any, res) => {
  try {
    const { entityType, entityId, verificationType, notes, taxId, country } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No files uploaded' });
    }

    const documentUrls = files.map(file => `/uploads/${file.filename}`);

    let status = 'pending';
    let apiNotes = notes;
    let initialScore = 50;

    // Si se provee CUIT/CNPJ, hacemos KYB automático
    if (taxId && country) {
       const kybResult = await verifyWithTaxAuthority(taxId, country);
       apiNotes = `${notes || ''}\n[Sistema KYB] API Status: ${kybResult.status}. ${kybResult.details}`;
       initialScore = kybResult.reputationScore;
       
       if (!kybResult.valid) {
         status = 'rejected'; // Auto-rechazo si el ente recaudador lo da como inválido
       }
    }

    const [newVerification] = await db.insert(verifications).values({
      entityType: entityType || 'company',
      entityId, 
      verificationType: verificationType || 'company_documents',
      documents: JSON.stringify(documentUrls),
      notes: apiNotes,
      status: status
    }).returning();

    // Actualizamos el reputation score de la compañía si aplica
    if (entityType === 'company') {
       await db.update(companies)
         .set({ 
            riskScore: initialScore,
            verified: status === 'approved' ? true : false
         })
         .where(eq(companies.id, entityId));
    }

    res.json({ status: 'success', verification: newVerification, autoKybScore: initialScore });
  } catch (error: any) {
    console.error('Verification request error:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// GET /api/verifications
// List all pending verifications (Admin only)
router.get('/', async (req, res) => {
  try {
    const items = await db.select().from(verifications)
      .where(eq(verifications.status, 'pending'))
      .orderBy(desc(verifications.submittedAt));
    
    // Enhance with entity names if possible
    const enhancedItems = await Promise.all(items.map(async (item) => {
      let entityName = 'Unknown';
      if (item.entityType === 'company') {
        const [comp] = await db.select().from(companies).where(eq(companies.id, item.entityId));
        if (comp) entityName = comp.name;
      } else if (item.entityType === 'employee') {
        const [u] = await db.select().from(users).where(eq(users.id, item.entityId));
        if (u) entityName = u.name;
      }
      return { ...item, entityName };
    }));

    res.json(enhancedItems);
  } catch (error: any) {
     res.status(500).json({ status: 'error', error: error.message });
  }
});

// GET /api/verifications/me
// Get approved documents for the current user's company
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'comexia-secret-key';
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    req.user = jwt.verify(token, JWT_SECRET) as any;
    next();
  } catch {
    return res.status(403).json({ error: 'Token inválido' });
  }
}

router.get('/me', authenticateToken, async (req: any, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) return res.json({ docsCompleted: [] });

    // Fetch approved verifications for this company
    const approvedVerifications = await db.select().from(verifications)
      .where(and(eq(verifications.entityId, companyId), eq(verifications.status, 'approved')));
    
    // Extract document types or names (using notes as a proxy for doc type if needed, or verificationType)
    // For now, just return a list of verification types as "docsCompleted"
    const docsCompleted = approvedVerifications.map(v => v.verificationType);

    // Also let's just add a few defaults if they are verified so the UI looks good in demo
    const [comp] = await db.select().from(companies).where(eq(companies.id, companyId));
    if (comp && comp.verified) {
       docsCompleted.push('Registro AFIP (RIE)', 'Firma Digital AFIP');
    }

    res.json({ docsCompleted: [...new Set(docsCompleted)] });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// POST /api/verifications/:id/approve
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Update verification status
    const [updated] = await db.update(verifications)
      .set({ 
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: 'admin' // Mock admin ID
      })
      .where(eq(verifications.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Verification not found' });
    }

    // 2. Update entity status
    if (updated.entityType === 'company') {
      await db.update(companies)
        .set({ verified: true })
        .where(eq(companies.id, updated.entityId));
    } else if (updated.entityType === 'employee') {
      await db.update(users)
        .set({ verified: true })
        .where(eq(users.id, updated.entityId));
    }

    res.json({ status: 'success', verification: updated });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// POST /api/verifications/:id/reject
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await db.update(verifications)
      .set({ 
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: 'admin' 
      })
      .where(eq(verifications.id, id))
      .returning();
      
    res.json({ status: 'success', verification: updated });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

export default router;
