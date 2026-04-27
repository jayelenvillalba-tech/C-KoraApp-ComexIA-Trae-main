import { Request, Response, NextFunction } from 'express';
import { sqliteDb } from '../../database/db-sqlite';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// SYNCED SECRET with user.ts and server-sqlite.ts
const JWT_SECRET = process.env.JWT_SECRET || 'comexia-secret-key';

// Helper to generate Token
function generateToken(user: any) {
    return jwt.sign(
        { id: user.id, email: user.email, companyId: user.company_id, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// Middleware to protect routes
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        (req as any).user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

export async function register(req: Request, res: Response) {
    try {
        const { companyName, userName, email, password, companyType = 'importer/exporter' } = req.body;

        if (!companyName || !userName || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!sqliteDb) return res.status(503).json({ error: 'DB not ready' });

        // 1. Check if email exists
        const existingUser = sqliteDb.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // 2. Hash Password
        const passwordHash = await bcrypt.hash(password, 10);

        // 3. Create Company & User in a transaction
        const companyId = crypto.randomUUID();
        const userId = crypto.randomUUID();

        const performRegistration = sqliteDb.transaction(() => {
            sqliteDb.prepare(`
                INSERT INTO companies (id, name, country, type, verified)
                VALUES (?, ?, ?, ?, ?)
            `).run(companyId, companyName, 'AR', companyType, 0);

            sqliteDb.prepare(`
                INSERT INTO users (id, company_id, name, email, password, role, verified)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(userId, companyId, userName, email, passwordHash, 'Admin', 0);
        });

        performRegistration();

        const newUser = { id: userId, name: userName, email, company_id: companyId, role: 'Admin' };
        const token = generateToken(newUser);

        res.json({
            token,
            user: {
                id: userId,
                name: userName,
                email: email,
                companyId: companyId,
                companyName: companyName
            }
        });

    } catch (error: any) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body;

        if (!sqliteDb) return res.status(503).json({ error: 'DB not ready' });

        // 1. Find User
        const user = sqliteDb.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 2. Check Password
        let validPassword = false;
        
        // Manual check for Villalba (keeping for legacy but adding hash check)
        if (email.toLowerCase() === 'j.ayelen.villalba@gmail.com' && password === 'Benicio180') {
             validPassword = true;
        } else if (user.password && (user.password.startsWith('$2b$') || user.password.startsWith('$2a$'))) {
             validPassword = await bcrypt.compare(password, user.password);
        } else {
             validPassword = (user.password === password); 
        }

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 3. Get Company
        const company = sqliteDb.prepare('SELECT name FROM companies WHERE id = ?').get(user.company_id) as any;

        // 4. Generate Token
        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                companyId: user.company_id,
                companyName: company?.name || 'Unknown Company'
            }
        });

    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getMe(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        
        if (!sqliteDb) return res.status(503).json({ error: 'DB not ready' });

        const user = sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
        if (!user) return res.status(404).json({ error: 'User not found' });

        const company = sqliteDb.prepare('SELECT name FROM companies WHERE id = ?').get(user.company_id) as any;

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            companyId: user.company_id,
            companyName: company?.name || 'Unknown',
            role: user.role
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
