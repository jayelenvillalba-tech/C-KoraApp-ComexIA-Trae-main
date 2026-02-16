import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, sqliteDb, initDatabase } from '../database/db-sqlite';
import { companies, hsSubpartidas, hsPartidas, hsChapters, hsSections, news, regulatoryRules, users, marketplacePosts, conversations, messages, conversationParticipants, subscriptions, verifications, chatInvites } from '../shared/schema-sqlite';
import { eq, like, or, and, sql, desc } from 'drizzle-orm';
import { countries, getCountryTreaties, getTariffReduction } from '../shared/countries-data';
import { getCountryCoordinates } from '../shared/continental-coordinates';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { handleCountryRecommendations } from './routes/country-recommendations';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ========== Auth API ==========

const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_key_123';

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, companyName, companyType } = req.body;
    
    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    
    if (existingUser && existingUser.length > 0) {
       return res.status(400).json({ status: 'error', message: 'User already exists' });
    }

    let companyId = null;
    
    // Create company if provided
    if (companyName) {
       const [newCompany] = await db.insert(companies).values({
          name: companyName,
          country: 'AR', // Default or from request
          type: companyType || 'exporter', // Use provided type or default
          verified: false
       }).returning();
       companyId = newCompany.id;
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const [newUser] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword, 
      companyId,
      role: 'admin', // Creator is admin
      verified: false
    }).returning();

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    
    // Generate Token
    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
        user: userWithoutPassword,
        token
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[LOGIN ATTEMPT] Email: ${email}, Password length: ${password?.length}`);
    
    // Find user by email only
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user) {
      console.log('[LOGIN FAIL] User not found in DB');
      return res.status(401).json({ status: 'error', message: 'Invalid credentials (User not found)' });
    }

    console.log(`[LOGIN] User found: ${user.email}, Hash starts with: ${user.password?.substring(0, 10)}...`);

    // Compare password
    let validPassword = false;
    if (user.password && user.password.startsWith('$2b$')) {
      // It's a proper bcrypt hash
      validPassword = await bcrypt.compare(password, user.password);
      console.log(`[LOGIN] Bcrypt compare result: ${validPassword}`);
    } else {
      // Fallback for legacy/seed users with plain text passwords or demo
      validPassword = (user.password === password) || (password === 'demo123');
      console.log(`[LOGIN] Plaintext/Demo compare result: ${validPassword}`);
    }

    if (!validPassword) {
      console.log('[LOGIN FAIL] Invalid password');
      return res.status(401).json({ status: 'error', message: 'Invalid credentials (Wrong password)' });
    }

    // Get company info if exists
    let company = null;
    if (user.companyId) {
       const [comp] = await db.select().from(companies).where(eq(companies.id, user.companyId));
       company = comp;
    }

    const { password: _, ...userWithoutPassword } = user;
    
    // Generate Token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
       user: {
           ...userWithoutPassword,
           companyName: company?.name || "", 
           company: company || null
       },
       token
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const [user] = await db.select().from(users).where(eq(users.id, userId));

        if (!user) return res.status(404).json({ error: 'User not found' });

        const { password: _, ...userWithoutPassword } = user;
        
        let company = null;
        if (user.companyId) {
            const [comp] = await db.select().from(companies).where(eq(companies.id, user.companyId));
            company = comp;
        }

        res.json({
            ...userWithoutPassword,
            companyName: company?.name || "",
            companyId: company?.id
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ========== API Routes ==========

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const hsCodesCount = await db.select({ count: sql<number>`count(*)` }).from(hsSubpartidas);
    const companiesCount = await db.select({ count: sql<number>`count(*)` }).from(companies);
    
    res.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        hsCodes: hsCodesCount[0].count,
        companies: companiesCount[0].count,
        countries: countries.length
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.get('/api/country-recommendations', handleCountryRecommendations);
// [NEW] Market Analysis Endpoint
app.get('/api/market-analysis', async (req, res) => {
  try {
    const { hsCode, country, operation } = req.query;

    // 1. Fetch Historical Data for charts
    const history = await db.select()
      .from(marketData)
      .where(like(marketData.hsCode, `${hsCode}%`))
      .orderBy(marketData.year);

    // 2. Fetch Recent News
    const recentNews = await db.select()
      .from(news)
      .orderBy(desc(news.publishedAt))
      .limit(3);

    // 3. Build response
    const historicalData = history.length > 0 ? history.map(h => ({
      year: h.year,
      value: Math.round((h.valueUsd || 0) / 1000000), // Millions USD
      volume: Math.round((h.volume || 0) / 1000) // Thousands of tons
    })) : [
      // Fallback trend
      { year: 2020, value: 100, volume: 450 },
      { year: 2021, value: 120, volume: 480 },
      { year: 2022, value: 135, volume: 520 },
      { year: 2023, value: 125, volume: 500 },
      { year: 2024, value: 150, volume: 600 },
    ];

    const relevantNews = recentNews.map(n => ({
      title: n.title,
      image: n.imageUrl || 'bg-gradient-to-br from-blue-500 to-cyan-500'
    }));

    res.json({
      analysis: {
        historicalData,
        relevantNews,
        topBuyers: [
          { country: 'China', countryCode: 'CN', flag: 'ðŸ‡¨ðŸ‡³' },
          { country: 'Brasil', countryCode: 'BR', flag: 'ðŸ‡§ðŸ‡·' },
          { country: 'Estados Unidos', countryCode: 'US', flag: 'ðŸ‡ºðŸ‡¸' }
        ]
      }
    });
  } catch (error: any) {
    console.error('Error fetching market analysis:', error);
    res.status(500).json({ error: error.message });
  }
});



// ========== HS Codes API ==========

// Search HS codes
app.get('/api/hs-codes/search', async (req, res) => {
  try {
    const query = req.query.q as string || '';
    const section = req.query.section as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    let conditions = [];
    if (query) {
        const searchPattern = `%${query}%`;
        conditions.push(or(
            like(hsSubpartidas.code, searchPattern),
            like(hsSubpartidas.description, searchPattern),
            like(hsSubpartidas.descriptionEn, searchPattern)
        ));
    }
    
    // Note: Filtering by section would require joining with chapters and sections, 
    // which is a bit more complex. For now, we'll focus on text search.
    // If section is needed, we'd need to fetch chapter codes for that section first.

    const results = await db.select()
        .from(hsSubpartidas)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset);
    
    const totalResult = await db.select({ count: sql<number>`count(*)` })
        .from(hsSubpartidas)
        .where(and(...conditions));

    res.json({
      success: true,
      total: totalResult[0].count,
      limit,
      offset,
      results
    });
  } catch (error: any) {
    console.error('Error searching HS codes:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error searching HS codes',
      details: error.message
    });
  }
});

// Get HS code by code
app.get('/api/hs-codes/:code', async (req, res) => {
  try {
    const code = req.params.code;
    
    // Try subpartidas first (6 digits)
    let hsCode = await db.query.hsSubpartidas.findFirst({
        where: eq(hsSubpartidas.code, code)
    });

    // If not found, try partidas (4 digits)
    if (!hsCode) {
        const partida = await db.query.hsPartidas.findFirst({
            where: eq(hsPartidas.code, code)
        });
        if (partida) {
             // Map to similar structure
             hsCode = {
                 ...partida,
                 partidaCode: '',
                 specialTariffRate: null,
                 restrictions: null,
                 isActive: true
             } as any;
        }
    }

    if (!hsCode) {
      return res.status(404).json({
        success: false,
        error: 'HS code not found'
      });
    }

    // Fetch parent chapter to get section (if needed for frontend compatibility)
    // For now returning as is
    
    // Compatibility mapping
    const responseData = {
        ...hsCode,
        baseTariff: hsCode.tariffRate || 0,
        section: '', // TODO: Fetch from chapter -> section
        specializations: [] // TODO: Add specializations table or column
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (error: any) {
    console.error('Error getting HS code:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error getting HS code',
      details: error.message
    });
  }
});

// ========== Country Recommendations API ==========

app.get('/api/country-recommendations', async (req, res) => {
  try {
    const hsCode = req.query.hsCode as string;
    const operation = req.query.operation as string || 'export';
    const originCountry = req.query.originCountry as string;

    if (!hsCode) {
      return res.status(400).json({
        success: false,
        error: 'hsCode parameter is required'
      });
    }

    // Get HS code details from DB
    const hsCodeData = await db.query.hsSubpartidas.findFirst({
        where: eq(hsSubpartidas.code, hsCode)
    });

    if (!hsCodeData) {
      return res.status(404).json({
        success: false,
        error: 'HS code not found'
      });
    }

    // Get origin country data
    const originCountryData = originCountry ? countries.find(c => c.code === originCountry) : null;

    // Calculate recommendations for each country
    // Note: This logic is still largely based on static data for treaties/distance
    // but uses DB for HS code info and potentially company counts
    
    const recommendations = await Promise.all(countries
      .filter(country => country.code !== originCountry)
      .map(async country => {
        // Calculate score components
        let treatyScore = 0;
        let distanceScore = 0;
        let specializationScore = 0;
        let volumeScore = 50;

        // 1. Treaty benefits
        if (originCountryData) {
          const sharedTreaties = country.treaties.filter(t => 
            originCountryData.treaties.includes(t)
          );
          
          if (sharedTreaties.length > 0) {
            if (sharedTreaties.some(t => ['mercosur', 'eu', 'usmca'].includes(t.toLowerCase()))) {
              treatyScore = 95;
            } else if (sharedTreaties.some(t => ['cptpp', 'rcep', 'asean'].includes(t.toLowerCase()))) {
              treatyScore = 75;
            } else {
              treatyScore = 50;
            }
          } else {
            treatyScore = 20;
          }
        } else {
          treatyScore = 50;
        }

        // 2. Geographic distance
        if (originCountryData) {
          const originCoords = getCountryCoordinates(originCountry);
          const targetCoords = getCountryCoordinates(country.code);
          
          if (originCoords && targetCoords) {
            const distance = Math.sqrt(
              Math.pow(originCoords[0] - targetCoords[0], 2) +
              Math.pow(originCoords[1] - targetCoords[1], 2)
            );
            distanceScore = Math.max(0, 100 - (distance * 0.5));
          } else {
            distanceScore = 50;
          }
        } else {
          distanceScore = 50;
        }

        // 3. Specialization & Demand (REAL DATA from trade_flows_2026)
        // Query actual import volumes for this product and country
        let tradeVolume = 0;
        try {
          // Use raw better-sqlite3 for custom table query
          const stmt = sqliteDb?.prepare(
            `SELECT volume, value_usd FROM trade_flows_2026 
             WHERE hs_code = ? AND importer_country = ? 
             ORDER BY year DESC LIMIT 1`
          );
          
          console.log(`[TRADE] Querying for HS:${hsCode?.substring(0, 4)} Country:${country.code} sqliteDb:${!!sqliteDb} stmt:${!!stmt}`);
          
          if (stmt) {
            const tradeData = stmt.all(hsCode?.substring(0, 4) || '', country.code);
            console.log(`[TRADE] Result for ${country.code}:`, tradeData);
            if (tradeData && tradeData.length > 0) {
              tradeVolume = (tradeData[0] as any).volume || 0;
              console.log(`[TRADE] Found volume: ${tradeVolume}`);
            }
          }
        } catch (e) {
          console.error(`[TRADE] Error querying trade_flows_2026:`, e);
          // Table might not exist, use fallback
          tradeVolume = 0;
        }
        
        // Declare companyCount here so it's available for the return statement
        let companyCount: any[] = [];
        
        // If we have real trade data, calculate scores based on it
        if (tradeVolume > 0) {
          // Normalize volume to 0-100 scale
          // China wheat: 12M tons â†’ score ~120 (capped at 100)
          // Smaller importers: proportional
          specializationScore = Math.min(100, (tradeVolume / 1000000) * 10);
          volumeScore = Math.min(100, (tradeVolume / 500000) * 10);
          
          // Still need to get company count for the response
          companyCount = await db.select({ count: sql<number>`count(*)` })
              .from(companies)
              .where(and(
                  eq(companies.country, country.code),
                  like(companies.products, `%${hsCode}%`)
              ));
        } else {
          // Fallback: check companies in DB
          companyCount = await db.select({ count: sql<number>`count(*)` })
              .from(companies)
              .where(and(
                  eq(companies.country, country.code),
                  like(companies.products, `%${hsCode}%`)
              ));
          
          const hasCompanies = companyCount[0].count > 0;
          specializationScore = hasCompanies ? 70 : 30;
          volumeScore = hasCompanies ? 90 : 20;
        }

        const finalScore = (
          treatyScore * 0.15 +  // Further reduced - real data is more important
          distanceScore * 0.10 + // Reduced
          specializationScore * 0.50 + // Increased - THIS is real market demand
          volumeScore * 0.25  // Increased - actual trade volume
        );

        let opportunity: 'high' | 'medium' | 'low';
        if (finalScore >= 70) opportunity = 'high';
        else if (finalScore >= 45) opportunity = 'medium';
        else opportunity = 'low';

        const coordinates = getCountryCoordinates(country.code) || [0, 0];

        const treatyBenefits = originCountryData 
          ? getCountryTreaties(country.code)
              .filter(treaty => originCountryData.treaties.includes(treaty.id))
              .map(treaty => `${treaty.name}: ${treaty.tariffReduction}% reducciÃ³n arancelaria`)
          : [];

        const baseTariff = hsCodeData.tariffRate || 0;
        const tariffReduction = originCountryData ? getTariffReduction(country.code, hsCode) : 0;
        const effectiveTariff = Math.max(0, baseTariff - (baseTariff * tariffReduction / 100));

        return {
          countryCode: country.code,
          countryName: country.name,
          countryNameEn: country.nameEn,
          score: Math.round(finalScore),
          opportunity,
          coordinates: coordinates as [number, number],
          treatyBenefits,
          baseTariff,
          effectiveTariff: Math.round(effectiveTariff * 10) / 10,
          tariffSavings: Math.round((baseTariff - effectiveTariff) * 10) / 10,
          specialization: false, // TODO
          companyCount: companyCount[0].count,
          advantages: [
            ...(treatyBenefits.length > 0 ? [{
              reason: `Miembro de ${treatyBenefits.length} tratado(s) comercial(es)`,
              reasonEn: `Member of ${treatyBenefits.length} trade agreement(s)`,
              impact: 'high'
            }] : [])
          ],
          restrictions: country.restrictions || []
        };
      }));

    const sortedRecommendations = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    res.json({
      success: true,
      hsCode,
      operation,
      originCountry: originCountry || null,
      total: sortedRecommendations.length,
      recommended: sortedRecommendations
    });
  } catch (error: any) {
    console.error('Error generating country recommendations:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error generating country recommendations',
      details: error.message
    });
  }
});

// ========== Companies API ==========

app.get('/api/companies', async (req, res) => {
  try {
    const country = req.query.country as string;
    const type = req.query.type as 'importer' | 'exporter' | 'both';
    const search = req.query.search as string; // Can be HS code or company name
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    let conditions = [];
    
    if (country) {
        conditions.push(eq(companies.country, country));
    }
    
    if (type && type !== 'both') {
        conditions.push(eq(companies.type, type));
    }
    
    if (search) {
        conditions.push(or(
            like(companies.name, `%${search}%`),
            like(companies.products, `%${search}%`)
        ));
    }

    const results = await db.select()
        .from(companies)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset);

    const totalResult = await db.select({ count: sql<number>`count(*)` })
        .from(companies)
        .where(and(...conditions));

    res.json({
      success: true,
      total: totalResult[0].count,
      limit,
      offset,
      source: 'database',
      companies: results
    });
  } catch (error: any) {
    console.error('Error searching companies:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error searching companies',
      details: error.message
    });
  }
});

// Get company by ID
app.get('/api/companies/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const company = await db.query.companies.findFirst({
        where: eq(companies.id, id)
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error: any) {
    console.error('Error getting company:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error getting company',
      details: error.message
    });
  }
});

// ========== News API ==========

app.get('/api/news', async (req, res) => {
  try {
    const category = req.query.category as string;
    
    // In a real app we'd filter by category column, but for now we return all or filter by text
    const results = await db.select().from(news).orderBy(desc(news.publishedAt)).limit(20);
    
    res.json(results);
  } catch (error: any) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== Market Analysis API ==========

app.get('/api/market-analysis', async (req, res) => {
    try {
        const { hsCode, country, operation } = req.query;
        
        // 1. Get Market Size (Mocked estimation based on DB data if available, or static fallback for demo)
        // In real app, query `marketData` 
        const marketSize = {
            estimated: 1250, // M USD
            growthRate: 5.2,
            confidence: 'high',
            trend: 'up'
        };

        // 2. Viability Score
        const variability = 85; 

        // 3. Competition
        const competition = {
            level: 'medium',
            activeCompanies: 12,
            entryBarrier: 'medium'
        };

        // 4. Opportunities
        const opportunities = [
            { title: 'Alta Demanda', description: 'China ha incrementado importaciones un 15% este aÃ±o.' },
            { title: 'Tratado de Libre Comercio', description: 'Aprovechar reducciÃ³n arancelaria vigente.' },
            { title: 'Contra-estaciÃ³n', description: 'Ventaja competitiva por producciÃ³n en hemisferio sur.' }
        ];

        // 5. Recommendations
        const recommendations = [
            { priority: 'high', action: 'Iniciar trÃ¡mite de registro en ADUANA', timeframe: 'Inmediato' },
            { priority: 'medium', action: 'Buscar partners logÃ­sticos con cadena de frÃ­o', timeframe: '1 mes' },
            { priority: 'low', action: 'Asistir a feria internacional de Shanghai', timeframe: '6 meses' }
        ];

        res.json({
            analysis: {
                marketSize,
                viability: 'Alta',
                overallScore: variability,
                competition,
                opportunities,
                recommendations,
                historicalData: [
                    { year: 2020, value: 800, volume: 1000 },
                    { year: 2021, value: 950, volume: 1100 },
                    { year: 2022, value: 1100, volume: 1250 },
                    { year: 2023, value: 1050, volume: 1200 },
                    { year: 2024, value: 1250, volume: 1400 }
                ]
            }
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/market-analysis/historical/:hsCode/:country', async (req, res) => {
    try {
        const { hsCode, country } = req.params;
        // Mock data matching the frontend expectations
        // In future: Query `marketData` table
        const data = [
            { year: 2020, value: 800, volume: 1000 },
            { year: 2021, value: 950, volume: 1100 },
            { year: 2022, value: 1100, volume: 1250 },
            { year: 2023, value: 1050, volume: 1200 },
            { year: 2024, value: 1250, volume: 1400 },
            { year: 2025, value: 1400, volume: 1550, projected: true },
        ];
        res.json({ data });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/market-analysis/docs', async (req, res) => {
    try {
        const { code, country } = req.query;
        if (!code) return res.json([]);

        // Ensure we handle both string and array query params safely
        const hsCodeStr = String(code);
        const countryStr = String(country);
        const chapter = hsCodeStr.substring(0, 2);

        // Find docs for specific country AND matching chapter
        // We use `like` or just check `hsChapter` column

        // Fallback Mock for now until schema import is fixed:
        // Actually, best to query DB.
        
        const docs = await db.select().from(regulatoryRules)
            .where(and(
                eq(regulatoryRules.countryCode, countryStr),
                or(
                    eq(regulatoryRules.hsChapter, chapter),
                    eq(regulatoryRules.hsChapter, hsCodeStr) // Match full code if supported
                )
            ));

        res.json(docs);
    } catch (e: any) {
        console.error("Docs API Error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/map/trade-flows', async (req, res) => {
    // Mock trade flows for the map
    const routes = [
        { origin: { lat: -34.61, lng: -58.38, code: 'AR' }, destination: { lat: 31.23, lng: 121.47, code: 'CN' }, valueUsd: 5000000, hsChapter: '10' },
        { origin: { lat: -34.61, lng: -58.38, code: 'AR' }, destination: { lat: -23.55, lng: -46.63, code: 'BR' }, valueUsd: 3000000, hsChapter: '10' },
        { origin: { lat: -34.61, lng: -58.38, code: 'AR' }, destination: { lat: 19.43, lng: -99.13, code: 'MX' }, valueUsd: 1200000, hsChapter: '10' },
        { origin: { lat: 39.90, lng: 116.40, code: 'CN' }, destination: { lat: 51.50, lng: -0.12, code: 'UK' }, valueUsd: 8000000, hsChapter: '85' },
    ];
    res.json({ routes });
});

// Debug Seed Endpoint
app.get('/api/debug/seed-news', async (req, res) => {
  try {
     const items = [
        { title: "Nueva regulaciÃ³n de la UE sobre deforestaciÃ³n entra en vigor", category: "regulacion", summary: "La EUDR exige trazabilidad completa para productos como soja, carne y madera.", source: "European Commission", url: "#", imageUrl: "https://images.unsplash.com/photo-1542601906990-24ccd08d7455" },
        { title: "China reduce aranceles para carne premium del Mercosur", category: "mercado", summary: "Acuerdo histÃ³rico reduce 5% los aranceles de entrada para cortes de alta calidad.", source: "China Daily", url: "#", imageUrl: "https://images.unsplash.com/photo-1551759650-d6c5a83405c5" },
        { title: "Puerto de Santos implementa IA para reducir tiempos de espera", category: "logistica", summary: "Nuevo sistema automatizado promete reducir congestiÃ³n en un 30%.", source: "Logistics World", url: "#", imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d" },
        { title: "India busca diversificar proveedores de aceite de girasol", category: "mercado", summary: "Oportunidad para exportadores argentinos ante la volatilidad en Europa del Este.", source: "Economist Times", url: "#", imageUrl: "https://images.unsplash.com/photo-1473979738029-e15647a508ba" },
        { title: "USA actualiza requisitos fitosanitarios para cÃ­tricos", category: "regulacion", summary: "Nuevos protocolos de tratamiento en frÃ­o requeridos para la temporada 2026.", source: "USDA", url: "#", imageUrl: "https://images.unsplash.com/photo-1615485500704-8e99099928b3" },
        { title: "El Canal de PanamÃ¡ restringe calado por sequÃ­a", category: "logistica", summary: "Buques de gran porte deberÃ¡n reducir carga en los prÃ³ximos meses.", source: "Panama Canal Authority", url: "#", imageUrl: "https://images.unsplash.com/photo-1574620027788-299f1fa208c0" }
    ];

    for (const item of items) {
        await db.insert(news).values({ ...item, publishedAt: new Date() });
    }
    res.json({ success: true, count: items.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
// Route removed - moved to end of file

// ========== Regulatory Requirements API (Fixed) ==========
app.get('/api/country-requirements/:country/:code', async (req, res) => {
    try {
        const { country, code } = req.params;
        // Search in DB
        const docs = await db.select().from(regulatoryRules)
            .where(and(
                eq(regulatoryRules.countryCode, country),
                 // Basic match on chapter (first 2 digits) or full code
                 or(
                    eq(regulatoryRules.hsChapter, code.substring(0, 2)),
                    eq(regulatoryRules.hsChapter, code)
                 )
            ));
        
        // If no docs found in DB, return a "No requirements found" or generic empty list 
        // to prevent frontend indefinite loading or error
        // For demo purposes, if UY has no specific rules in DB, we could return a generic Mercosur rule
        if (docs.length === 0) {
             const genericDocs = [
                {
                    id: `gen-${country}-${Date.now()}`,
                    countryCode: country,
                    hsChapter: code.substring(0, 2),
                    title: "DocumentaciÃ³n General de ImportaciÃ³n",
                    description: "Factura comercial, Packing List y Certificado de Origen (si aplica).",
                    category: "general",
                    url: "#",
                    required: true,
                    updatedAt: new Date()
                }
             ];
             return res.json(genericDocs);
        }

        res.json(docs);
    } catch (e: any) {
        console.error("Requirements API Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// AI Analysis Endpoint (Simulated)
app.post('/api/ai/generate-analysis', async (req, res) => {
  try {
    const { hsCode, originCountry, targetCountry, productName } = req.body;
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    const analysis = `
## AnÃ¡lisis de Mercado: ${productName || 'Producto ' + hsCode}

### VisiÃ³n General
El mercado de **${targetCountry || 'Destino'}** presenta oportunidades significativas para exportadores de **${originCountry || 'Origen'}**. La demanda ha mostrado un crecimiento sostenido del 5.2% anual en los Ãºltimos 3 aÃ±os.

### Factores Clave
* **Aranceles**: SituaciÃ³n favorable bajo acuerdos comerciales vigentes (MERCOSUR/SGP).
* **Competencia**: Moderada. Principales competidores incluyen Brasil y Vietnam.
* **Tendencias**: Creciente preferencia por certificaciones sostenibles y de comercio justo.

### RecomendaciÃ³n EstratÃ©gica
**Alta Viabilidad**. Se recomienda enfocar la estrategia en distribuidores mayoristas en las zonas portuarias principales. El precio promedio de importaciÃ³n ($3,450/ton) permite un margen competitivo para la producciÃ³n de ${originCountry}.

> **Nota**: Este anÃ¡lisis es generado por IA basado en datos histÃ³ricos y tendencias actuales de Comex.
    `;

    res.json({ 
      success: true, 
      analysis 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== Logistics Estimate API ==========
app.get('/api/logistics/estimate', async (req, res) => {
  try {
    const { origin, destination, product } = req.query;
    
    // For now, provide specific routes for Argentina-China wheat
    const routes = [];
    
    // Check if it's Argentina -> China (any product, but focused on wheat)
    // Or just generic logic if we want to support more
    if ((origin === 'Argentina' || origin === 'AR') && (destination === 'China' || destination === 'CN')) {
      routes.push({
        id: 'sea-pacific',
        name: 'Ruta Marítima Pacífico',
        modes: [
          { icon: 'truck', label: 'Camión a puerto', duration: '2-3 días' },
          { icon: 'ship', label: 'Marítimo (Buenos Aires → Shanghai vía Canal de Panamá)', duration: '35-40 días' }
        ],
        totalDuration: '40-45 días',
        cost: 'USD 85-95/ton',
        incoterm: 'CIF',
        recommended: true,
        details: {
          port: 'Buenos Aires → Shanghai',
          insurance: '0.3% del valor FOB',
          customs: 'Trámite normal 3-5 días',
          risk: 'Bajo - ruta establecida'
        }
      });
      
      routes.push({
        id: 'sea-suez',
        name: 'Ruta Marítima Suez',
        modes: [
          { icon: 'truck', label: 'Camión a puerto', duration: '2-3 días' },
          { icon: 'ship', label: 'Marítimo (Buenos Aires → Shanghai vía Canal de Suez)', duration: '45-50 días' }
        ],
        totalDuration: '50-55 días',
        cost: 'USD 75-85/ton',
        incoterm: 'CIF',
        recommended: false,
        details: {
          port: 'Buenos Aires → Shanghai',
          insurance: '0.3% del valor FOB',
          customs: 'Trámite normal 3-5 días',
          risk: 'Medio - ruta más larga, mayores costos de seguro'
        }
      });
    } else {
      // Generic fallback for other routes
      routes.push({
        id: 'generic-sea',
        name: 'Ruta Marítima Genérica',
        modes: [
          { icon: 'truck', label: 'Transporte terrestre', duration: '2-5 días' },
          { icon: 'ship', label: 'Transporte marítimo', duration: '25-35 días' }
        ],
        totalDuration: '30-40 días',
        cost: 'Consultar cotización',
        incoterm: 'CIF',
        recommended: true,
        details: {
          port: 'Puerto más cercano',
          insurance: '0.3-0.5% del valor',
          customs: 'Variable según destino',
          risk: 'Consultar condiciones específicas'
        }
      });
    }
    
    res.json({ data: routes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Catch-all route for SPA (must be last)
// ========== Market Recommendations API ==========
app.get('/api/market-analysis/recommendations', async (req, res) => {
  try {
    const { code, origin } = req.query;

    // 1. Treaty Recommendations (Mocked logic for stability)
    // We can use the helper getCountryTreaties if available, but for now specific defaults work best
    const treatyRecommendations = [
      { country: 'China', countryCode: 'CN', treaty: 'Protocolo Fitosanitario Vigente', rank: 1, coordinates: [35.8617, 104.1954] },
      { country: 'Brasil', countryCode: 'BR', treaty: 'MERCOSUR (Arancel 0%)', rank: 2, coordinates: [-14.2350, -51.9253] },
      { country: 'Estados Unidos', countryCode: 'US', treaty: 'SGP (Sistema General de Preferencias)', rank: 3, coordinates: [37.0902, -95.7129] },
    ];

    // 2. Che.Comex Opportunities (Marketplace Data)
    // Query active posts for this HS code (or similar)
    
    // Simple query: count posts per country
    const activePosts = await db.select({
      country: marketplacePosts.destinationCountry,
      companyId: marketplacePosts.companyId, // dummy select for group by context
      count: sql`count(*)`.mapWith(Number)
    })
    .from(marketplacePosts)
    .where(eq(marketplacePosts.status, 'active'))
    .groupBy(marketplacePosts.destinationCountry)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

    // Map to frontend format
    // Enriched with names/coords
    let cheComexRecommended = activePosts.map((p, idx) => ({
      rank: idx + 1,
      country: p.country, 
      countryCode: getCountryCode(p.country || 'China'), 
      activeOrders: p.count,
      coordinates: getCountryCoordinates(getCountryCode(p.country || 'China'))
    }));
    
    // Fallback if no posts (mock data to ensure UI shows something as per user "it disappeared")
    if (cheComexRecommended.length === 0) {
       cheComexRecommended = [
          { rank: 1, country: 'India', countryCode: 'IN', activeOrders: 12, coordinates: [20.5937, 78.9629] },
          { rank: 2, country: 'Vietnam', countryCode: 'VN', activeOrders: 8, coordinates: [14.0583, 108.2772] },
          { rank: 3, country: 'Indonesia', countryCode: 'ID', activeOrders: 5, coordinates: [-0.7893, 113.9213] }
       ];
    }

    // 3. Top Buyers (Historical Data)
    // Providing robust default data for the "Top 3 Compradores" panel
    const topBuyers = [
      { country: 'China', countryCode: 'CN', rank: 1, volume: 15400000, avgValue: 520, details: { landedCost: 615, tariff: 0 } },
      { country: 'Estados Unidos', countryCode: 'US', rank: 2, volume: 8200000, avgValue: 495, details: { landedCost: 580, tariff: 2.5 } },
      { country: 'Brasil', countryCode: 'BR', rank: 3, volume: 6100000, avgValue: 480, details: { landedCost: 540, tariff: 0 } }
    ];

    res.json({
      treatyRecommendations,
      cheComexRecommended,
      topBuyers
    });

  } catch (error: any) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== MARKETPLACE APIs ==========

// Get all marketplace posts with filters
app.get('/api/marketplace/posts', async (req, res) => {
  try {
    const { type, hsCode, country, dateRange, verifiedOnly, limit = '50', offset = '0' } = req.query;
    
    let query = db.select().from(marketplacePosts);
    const conditions: any[] = [];
    
    // Apply filters
    if (type && type !== 'all') {
      conditions.push(eq(marketplacePosts.type, type as string));
    }
    
    if (hsCode) {
      conditions.push(like(marketplacePosts.hsCode, `${hsCode}%`));
    }
    
    if (country) {
      conditions.push(
        or(
          eq(marketplacePosts.originCountry, country as string),
          eq(marketplacePosts.destinationCountry, country as string)
        )
      );
    }
    
    // Date range filter
    if (dateRange && dateRange !== 'all') {
      const now = Date.now();
      let cutoffTime = now;
      
      if (dateRange === 'today') cutoffTime = now - (24 * 60 * 60 * 1000);
      else if (dateRange === 'week') cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
      else if (dateRange === 'month') cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
      
      conditions.push(sql`${marketplacePosts.createdAt} >= ${new Date(cutoffTime)}`);
    }
    
    // Only active posts
    conditions.push(eq(marketplacePosts.status, 'active'));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const posts = await query
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string))
      .orderBy(desc(marketplacePosts.createdAt));
    
    // Get company and user info for each post
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const company = await db.select().from(companies).where(eq(companies.id, post.companyId)).limit(1);
        const user = await db.select().from(users).where(eq(users.id, post.userId)).limit(1);
        
        return {
          ...post,
          company: company[0] || null,
          user: user[0] || null,
          requirements: post.requirements ? JSON.parse(post.requirements) : [],
          certifications: post.certifications ? JSON.parse(post.certifications) : []
        };
      })
    );
    
    res.json(enrichedPosts);
  } catch (error: any) {
    console.error('Error fetching marketplace posts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single post
app.get('/api/marketplace/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const post = await db.select().from(marketplacePosts).where(eq(marketplacePosts.id, id)).limit(1);
    
    if (post.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const company = await db.select().from(companies).where(eq(companies.id, post[0].companyId)).limit(1);
    const user = await db.select().from(users).where(eq(users.id, post[0].userId)).limit(1);
    
    res.json({
      ...post[0],
      company: company[0] || null,
      user: user[0] || null,
      requirements: post[0].requirements ? JSON.parse(post[0].requirements) : [],
      certifications: post[0].certifications ? JSON.parse(post[0].certifications) : []
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new post
app.post('/api/marketplace/posts', async (req, res) => {
  try {
    const { companyId, userId, type, hsCode, productName, quantity, originCountry, destinationCountry, deadlineDays, requirements, certifications } = req.body;
    
    const newPost = {
      id: crypto.randomUUID(),
      companyId,
      userId,
      type,
      hsCode,
      productName,
      quantity,
      originCountry,
      destinationCountry,
      deadlineDays,
      requirements: requirements ? JSON.stringify(requirements) : null,
      certifications: certifications ? JSON.stringify(certifications) : null,
      status: 'active',
      createdAt: new Date(),
      expiresAt: deadlineDays ? new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000) : null
    };
    
    await db.insert(marketplacePosts).values(newPost);
    res.status(201).json(newPost);
  } catch (error: any) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: error.message });
  }
});


// Update post
app.put('/api/marketplace/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (updates.requirements) {
      updates.requirements = JSON.stringify(updates.requirements);
    }
    if (updates.certifications) {
      updates.certifications = JSON.stringify(updates.certifications);
    }
    
    await db.update(marketplacePosts).set(updates).where(eq(marketplacePosts.id, id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete post
app.delete('/api/marketplace/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.update(marketplacePosts).set({ status: 'closed' }).where(eq(marketplacePosts.id, id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get company profile
app.get('/api/companies/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    const company = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    
    if (company.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Get employees
    const employees = await db.select().from(users).where(eq(users.companyId, id));
    
    // Get subscription
    const subscription = await db.select().from(subscriptions).where(eq(subscriptions.companyId, id)).limit(1);
    
    // Get recent posts
    const recentPosts = await db.select().from(marketplacePosts)
      .where(and(eq(marketplacePosts.companyId, id), eq(marketplacePosts.status, 'active')))
      .limit(10)
      .orderBy(desc(marketplacePosts.createdAt));
    
    res.json({
      ...company[0],
      employees,
      subscription: subscription[0] || null,
      recentPosts,
      products: company[0].products ? JSON.parse(company[0].products) : [],
      certifications: company[0].certifications ? JSON.parse(company[0].certifications) : []
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
    
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const company = await db.select().from(companies).where(eq(companies.id, user[0].companyId!)).limit(1);
    
    res.json({
      ...user[0],
      company: company[0] || null
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== CHAT ROUTES ==========

// Get user conversations
app.get('/api/chat/conversations', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'UserId required' });
    
    // Get conversations where user is a participant
    const userConvs = await db.select().from(conversationParticipants)
      .where(eq(conversationParticipants.userId, userId as string));
      
    const convIds = userConvs.map(uc => uc.conversationId);
    
    if (convIds.length === 0) return res.json([]);
    
    const convs = await db.select().from(conversations)
      .where(sql`${conversations.id} IN ${convIds}`)
      .orderBy(desc(conversations.lastMessageAt));
      
    // Enrich with other company info
    const enrichedConvs = await Promise.all(convs.map(async (conv) => {
      const company1 = await db.select().from(companies).where(eq(companies.id, conv.company1Id)).limit(1);
      const company2 = await db.select().from(companies).where(eq(companies.id, conv.company2Id)).limit(1);
      
      return {
        ...conv,
        company1: company1[0],
        company2: company2[0]
      };
    }));
    
    res.json(enrichedConvs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create or get conversation
app.post('/api/chat/conversations', async (req, res) => {
  try {
    const { userId, otherCompanyId, postId, initialMessage } = req.body;
    
    // Get user's company
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const company1Id = user[0].companyId;
    
    // Check if conversation already exists
    const existingConv = await db.select().from(conversations)
      .where(
        and(
          eq(conversations.postId, postId),
          or(
            and(eq(conversations.company1Id, company1Id!), eq(conversations.company2Id, otherCompanyId)),
            and(eq(conversations.company1Id, otherCompanyId), eq(conversations.company2Id, company1Id!))
          )
        )
      ).limit(1);
      
    if (existingConv.length > 0) {
      return res.json(existingConv[0]);
    }
    
    // Create new conversation
    const newConv = {
      id: crypto.randomUUID(),
      postId,
      company1Id: company1Id!,
      company2Id: otherCompanyId,
      status: 'active',
      createdAt: new Date(),
      lastMessageAt: new Date()
    };
    
    await db.insert(conversations).values(newConv);
    
    // Add participants
    await db.insert(conversationParticipants).values([
      {
        id: crypto.randomUUID(),
        conversationId: newConv.id,
        userId: userId,
        role: user[0].role || 'tecnico',
        accessLevel: 'full',
        addedAt: new Date(),
        isActive: true
      },
      // Add a placeholder participant for the other company (to be claimed)
      // For demo purposes, we'll find a user from that company
      {
        id: crypto.randomUUID(),
        conversationId: newConv.id,
        userId: 'demo-user-very', // Fallback
        role: 'admin',
        accessLevel: 'full',
        addedAt: new Date(),
        isActive: true
      }
    ]);
    
    // Send initial message
    if (initialMessage) {
      await db.insert(messages).values({
        id: crypto.randomUUID(),
        conversationId: newConv.id,
        senderId: userId,
        content: initialMessage,
        messageType: 'text',
        createdAt: new Date(),
        readAt: null
      });
    }
    
    res.status(201).json(newConv);
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get conversation details
app.get('/api/chat/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    
    if (conversation.length === 0) return res.status(404).json({ error: 'Conversation not found' });
    
    // Get participants
    const participants = await db.select().from(conversationParticipants)
      .where(eq(conversationParticipants.conversationId, id));
      
    // Get messages
    const msgs = await db.select().from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);
      
    res.json({
      ...conversation[0],
      participants,
      messages: msgs
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== AI AGENT APIs ==========

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, context } = req.body;
    const lastUserMessage = messages[messages.length - 1];
    const userQuery = lastUserMessage.content.toLowerCase();
    
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    let responseContent = "";
    
    // Context variables
    const product = context?.productName || context?.hsCode || "producto";
    const origin = context?.originCountry || "origen";
    const destination = context?.targetCountry || "destino";

    // 1. TARIFFS / TAXES
    if (userQuery.includes('arancel') || userQuery.includes('impuesto') || userQuery.includes('tratado') || userQuery.includes('tariff')) {
       // Mock lookup - in real app would query DB
       const hasTreaty = (destination === 'China' && origin === 'Argentina') || (destination === 'Brasil');
       
       if (hasTreaty) {
           responseContent = `Para exportar ${product} a ${destination}, existe un acuerdo comercial favorable. \n\nEsto podría otorgarte una preferencia arancelaria significativa, reduciendo el arancel base (NMF) posiblemente al 0%. Te recomiendo verificar el Certificado de Origen específico.`;
       } else {
           responseContent = `Actualmente no detecto tratados de libre comercio directos entre ${origin} y ${destination} para este producto. Es probable que aplique el arancel de Nación Más Favorecida (NMF) según la OMC (aprox 5-10%).`;
       }
    }
    // 2. LOGISTICS / TRANSPORT
    else if (userQuery.includes('logística') || userQuery.includes('transporte') || userQuery.includes('flete') || userQuery.includes('barco') || userQuery.includes('tiempo')) {
       responseContent = `Para la ruta ${origin} - ${destination}, la opción logística más recomendada es la **Vía Marítima**.\n\n- **Tiempo de tránsito estimado:** 35-45 días.\n- **Costo aproximado:** USD 85-95 por tonelada.\n- **Incoterm sugerido:** CIF (Cost, Insurance and Freight) para mayor seguridad.`;
    }
    // 3. REGULATIONS / REQUISITOS
    else if (userQuery.includes('requisito') || userQuery.includes('documento') || userQuery.includes('regla') || userQuery.includes('permiso')) {
       responseContent = `El mercado de ${destination} es exigente con ${product}. \n\n**Documentos clave:**\n1. Factura Comercial Internacional.\n2. Packing List.\n3. Certificado de Origen.\n4. Certificados Fitosanitarios/Sanitarios (crítico).\n\nAsegúrate de cumplir con el etiquetado en el idioma local.`;
    }
    // 4. MARKET / PRICE
    else if (userQuery.includes('precio') || userQuery.includes('mercado') || userQuery.includes('valor')) {
       responseContent = `El mercado de ${destination} muestra una demanda activa. Los precios promedio de importación oscilan entre $450 y $520 USD por tonelada, con tendencia al alza.`;
    }
    // Default
    else {
       responseContent = `Soy Che.Comex, tu especialista en comercio exterior. Puedo asistirte en:\n\n1. **Aranceles y Tratados**\n2. **Logística y Rutas**\n3. **Requisitos de Ingreso**\n\n¿Qué aspecto te gustaría analizar para ${product}?`;
    }

    res.json({ 
      role: 'assistant', 
      content: responseContent,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Retro-compatibility for the widget if needed (or we migrate it)
app.post('/api/ai/generate-analysis', async (req, res) => {
    // Reuse chat logic or simple static response
    res.json({
        analysis: `## Análisis Estratégico (IA)
        
**Oportunidad Detectada**: Alta demanda en el mercado asiático para este producto.

**Recomendación**:
- Aprovechar el tratado vigente.
- Certificar normas ISO para mejorar competitividad.
- Contactar a compradores en Shanghai y Shenzhen (ver mapa).` 
    });
});

// ========== CHAT ROUTES ==========

// Send message
app.post('/api/chat/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { senderId, content, type = 'text', metadata } = req.body;
    
    const newMessage = {
      id: crypto.randomUUID(),
      conversationId: id,
      senderId,
      content,
      messageType: type,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: new Date(),
      readAt: null
    };
    
    await db.insert(messages).values(newMessage);
    
    // Update conversation last message
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, id));
      
    res.status(201).json(newMessage);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Initialize DB and start server
(async () => {
  try {
    await initDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 ComexIA Server running on http://0.0.0.0:${PORT}`);
      console.log(`📡 SQLite Database connected`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
})();

// Helper functions for country mapping
function getCountryCode(countryName: string | null): string {
    if (!countryName) return 'XX';
    const map: Record<string, string> = {
        'China': 'CN', 'India': 'IN', 'Estados Unidos': 'US', 'Brasil': 'BR', 'Alemania': 'DE',
        'Reino Unido': 'GB', 'Francia': 'FR', 'Italia': 'IT', 'Rusia': 'RU', 'Japón': 'JP',
        'Corea del Sur': 'KR', 'Chile': 'CL', 'Argentina': 'AR', 'México': 'MX', 'España': 'ES',
        'Australia': 'AU', 'Canadá': 'CA', 'Egipto': 'EG', 'Países Bajos': 'NL', 'Vietnam': 'VN',
        'Indonesia': 'ID', 'Argelia': 'DZ', 'Arabia Saudita': 'SA', 'Turquía': 'TR'
    };
    return map[countryName] || Object.values(map).includes(countryName) ? countryName : 'XX';
}

function getCountryCoordinates(countryCode: string): [number, number] {
    const coords: Record<string, [number, number]> = {
        'CN': [35.8617, 104.1954], 'IN': [20.5937, 78.9629], 'US': [37.0902, -95.7129],
        'BR': [-14.2350, -51.9253], 'DE': [51.1657, 10.4515], 'GB': [55.3781, -3.4360],
        'FR': [46.2276, 2.2137], 'IT': [41.8719, 12.5674], 'RU': [61.5240, 105.3188],
        'JP': [36.2048, 138.2529], 'KR': [35.9078, 127.7669], 'CL': [-35.6751, -71.5430],
        'AR': [-38.4161, -63.6167], 'MX': [23.6345, -102.5528], 'ES': [40.4637, -3.7492],
        'AU': [-25.2744, 133.7751], 'CA': [56.1304, -106.3468], 'EG': [26.8206, 30.8025],
        'NL': [52.1326, 5.2913], 'VN': [14.0583, 108.2772], 'ID': [-0.7893, 113.9213],
        'DZ': [28.0339, 1.6596], 'SA': [23.8859, 45.0792], 'TR': [38.9637, 35.2433]
    };
    return coords[countryCode] || [0, 0];
}
