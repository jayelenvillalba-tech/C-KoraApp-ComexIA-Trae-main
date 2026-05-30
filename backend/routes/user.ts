import { Router } from 'express';
import { sqliteDb } from '../../database/db-sqlite.js';
import jwt from 'jsonwebtoken';

const router = Router();

// Ensure phone and location columns exist (migration)
function ensureColumns() {
  if (!sqliteDb) return;
  try { sqliteDb.prepare('ALTER TABLE users ADD COLUMN phone TEXT').run(); } catch { /* already exists */ }
  try { sqliteDb.prepare('ALTER TABLE users ADD COLUMN location TEXT').run(); } catch { /* already exists */ }
}
ensureColumns();

// Middleware: Extract JWT user
const JWT_SECRET = process.env.JWT_SECRET || 'comexia-secret-key';
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Token inválido' });
  }
}

// GET /api/user/profile — Returns the current user's profile
router.get('/profile', authenticateToken, (req: any, res: any) => {
  try {
    if (!sqliteDb) return res.status(503).json({ error: 'DB not ready' });
    const userId = req.user.userId || req.user.id;
    const user = sqliteDb.prepare('SELECT id, name, email, role, company, phone, location FROM users WHERE id = ?').get(userId) as any;
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ success: true, user });
  } catch (err: any) {
    console.error('[user GET profile error]:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// PATCH /api/user/profile — Updates the current user's profile and linked company
router.patch('/profile', authenticateToken, (req: any, res: any) => {
  try {
    if (!sqliteDb) return res.status(503).json({ error: 'DB not ready' });
    const userId = req.user.userId || req.user.id;
    const { name, email, phone, location, role, country, industry, taxId, riskScore } = req.body;

    const user = sqliteDb.prepare('SELECT company_id FROM users WHERE id = ?').get(userId) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });

    const companyId = user.company_id;

    // Build dynamic update for user
    const userFields: string[] = [];
    const userValues: any[] = [];
    if (name !== undefined)     { userFields.push('name = ?');     userValues.push(name); }
    if (email !== undefined)    { userFields.push('email = ?');    userValues.push(email); }
    if (phone !== undefined)    { userFields.push('phone = ?');    userValues.push(phone); }
    if (location !== undefined) { userFields.push('location = ?'); userValues.push(location); }
    if (role !== undefined)     { userFields.push('role = ?');     userValues.push(role); }

    if (userFields.length > 0) {
      userValues.push(userId);
      sqliteDb.prepare(`UPDATE users SET ${userFields.join(', ')} WHERE id = ?`).run(...userValues);
    }

    // Build dynamic update for company
    if (companyId) {
      const companyFields: string[] = [];
      const companyValues: any[] = [];
      if (country !== undefined)   { companyFields.push('country = ?');      companyValues.push(country); }
      if (industry !== undefined)  { companyFields.push('business_type = ?'); companyValues.push(industry); }
      if (taxId !== undefined)     { companyFields.push('tax_id = ?');       companyValues.push(taxId); }
      if (riskScore !== undefined) { companyFields.push('risk_score = ?');   companyValues.push(riskScore); }

      if (companyFields.length > 0) {
        companyValues.push(companyId);
        sqliteDb.prepare(`UPDATE companies SET ${companyFields.join(', ')} WHERE id = ?`).run(...companyValues);
      }
    }

    const updated = sqliteDb.prepare('SELECT id, name, email, role, company, phone, location FROM users WHERE id = ?').get(userId) as any;
    res.json({ success: true, user: updated });
  } catch (err: any) {
    console.error('[user PATCH profile error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
