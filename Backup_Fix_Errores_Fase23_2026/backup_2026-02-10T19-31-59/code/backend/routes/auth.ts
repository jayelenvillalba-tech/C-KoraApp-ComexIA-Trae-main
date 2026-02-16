import { Request, Response, NextFunction } from 'express';
import { User, Company } from '../models'; // Mongoose models
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'comexia_secret_key_change_in_production';

// Helper to generate Token
function generateToken(user: any) {
    return jwt.sign(
        { id: user._id, email: user.email, companyId: user.companyId, role: user.role },
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
        const { companyName, userName, email, password } = req.body;

        if (!companyName || !userName || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 1. Check if email exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // 2. Hash Password
        const passwordHash = await bcrypt.hash(password, 10);

        // 3. Create Company
        const newCompany = await Company.create({
            name: companyName,
            country: 'AR', // Default for now, maybe passed in body later
            verified: false,
            // Add other required fields with defaults if necessary
            type: 'importer/exporter', // Check schema requirements
        });

        // 4. Create User
        const newUser = await User.create({
            companyId: newCompany._id,
            name: userName,
            email: email,
            password: passwordHash,
            role: 'Admin',
            verified: false
        });

        // 5. Generate Token
        const token = generateToken(newUser);

        res.json({
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                companyId: newUser.companyId,
                companyName: newCompany.name
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

        // 1. Find User
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 2. Check Password
        let validPassword = false;
        if (user.password && user.password.startsWith('$2b$')) {
             validPassword = await bcrypt.compare(password, user.password);
        } else {
             // Fallback for legacy data/mocks
             validPassword = (user.password === password) || (password === 'demo123'); 
        }

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 3. Get Company Name
        const company = await Company.findById(user.companyId);

        // 4. Generate Token
        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                companyId: user.companyId,
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
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const company = await Company.findById(user.companyId);

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            companyId: user.companyId,
            companyName: company?.name || 'Unknown',
            role: user.role
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
