import express from 'express';
import { db } from '../../database/db-sqlite';
import { companies, users, subscriptions, marketplacePosts } from '../../shared/schema-sqlite';
import { eq, like, or, and, sql, desc } from 'drizzle-orm';

const router = express.Router();

router.get('/', async (req, res) => {
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
router.get('/:id', async (req, res) => {
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

// Get company profile
router.get('/:id/profile', async (req, res) => {
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

export default router;
