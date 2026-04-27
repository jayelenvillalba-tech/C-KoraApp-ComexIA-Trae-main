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

// PATCH /api/user/profile — Updates the current user's profile
router.patch('/profile', authenticateToken, (req: any, res: any) => {
  try {
    if (!sqliteDb) return res.status(503).json({ error: 'DB not ready' });
    const userId = req.user.userId || req.user.id;
    const { name, email, phone, location } = req.body;

    // Build dynamic update
    const fields: string[] = [];
    const values: any[] = [];
    if (name !== undefined)     { fields.push('name = ?');     values.push(name); }
    if (email !== undefined)    { fields.push('email = ?');    values.push(email); }
    if (phone !== undefined)    { fields.push('phone = ?');    values.push(phone); }
    if (location !== undefined) { fields.push('location = ?'); values.push(location); }

    if (fields.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });

    values.push(userId);
    sqliteDb.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const updated = sqliteDb.prepare('SELECT id, name, email, role, company, phone, location FROM users WHERE id = ?').get(userId) as any;
    res.json({ success: true, user: updated });
  } catch (err: any) {
    console.error('[user PATCH profile error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
