// ========== MARKETPLACE API ==========

// GET /api/marketplace/posts - Fetch posts with Smart Filters
app.get('/api/marketplace/posts', async (req, res) => {
  try {
    const { sector, type, hsCode, country, subcategory, incoterm, ecological } = req.query;
    
    // Build dynamic WHERE conditions
    const conditions: any[] = [];
    
    if (sector) {
      conditions.push(eq(marketplacePosts.sector, sector as string));
    }
    
    if (type) {
      conditions.push(eq(marketplacePosts.postType, type as string));
    }
    
    if (hsCode) {
      conditions.push(like(marketplacePosts.hsCode, `%${hsCode}%`));
    }
    
    if (country) {
      conditions.push(
        or(
          eq(marketplacePosts.originCountry, country as string),
          eq(marketplacePosts.destinationCountry, country as string)
        )
      );
    }
    
    if (subcategory) {
      conditions.push(eq(marketplacePosts.subcategory, subcategory as string));
    }
    
    if (incoterm) {
      conditions.push(eq(marketplacePosts.incoterm, incoterm as string));
    }
    
    if (ecological === 'true') {
      conditions.push(eq(marketplacePosts.isEcological, true));
    }
    
    // Fetch posts with filters
    const query = conditions.length > 0
      ? db.select().from(marketplacePosts).where(and(...conditions)).orderBy(desc(marketplacePosts.createdAt))
      : db.select().from(marketplacePosts).orderBy(desc(marketplacePosts.createdAt));
    
    const posts = await query;
    
    // Enrich with company and user data
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const [company] = await db.select().from(companies).where(eq(companies.id, post.companyId));
        const [user] = await db.select().from(users).where(eq(users.id, post.userId));
        
        return {
          ...post,
          company: company ? {
            id: company.id,
            name: company.name,
            verified: company.verified,
            country: company.country
          } : null,
          user: user ? {
            id: user.id,
            name: user.name,
            role: user.role,
            verified: user.verified
          } : null,
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

// POST /api/marketplace/posts - Create new post with Smart Fields
app.post('/api/marketplace/posts', async (req, res) => {
  try {
    const {
      userId,
      companyId,
      type,
      hsCode,
      productName,
      quantity,
      originCountry,
      destinationCountry,
      deadlineDays,
      requirements,
      certifications,
      // Smart Filter Fields
      sector,
      subcategory,
      postType,
      incoterm,
      price,
      currency,
      isEcological
    } = req.body;
    
    // Validation
    if (!userId || !companyId || !productName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // For trade posts (buy/sell), require HS code
    if ((postType === 'buy' || postType === 'sell') && !hsCode) {
      return res.status(400).json({ error: 'HS Code is required for trade posts' });
    }
    
    // Auto-detect sector from HS code if not provided
    let finalSector = sector;
    if (!finalSector && hsCode) {
      const hsPrefix = hsCode.substring(0, 2);
      const sectorMap: Record<string, string> = {
        '01': 'Agriculture', '02': 'Agriculture', '03': 'Agriculture',
        '04': 'Agriculture', '05': 'Agriculture', '06': 'Agriculture',
        '07': 'Agriculture', '08': 'Agriculture', '09': 'Agriculture',
        '10': 'Agriculture', '11': 'Agriculture', '12': 'Agriculture',
        '84': 'Technology', '85': 'Technology',
        '87': 'Automotive', '88': 'Transport', '89': 'Transport'
      };
      finalSector = sectorMap[hsPrefix] || 'Other';
    }
    
    const newPost = {
      userId,
      companyId,
      type: type || postType, // Backward compatibility
      hsCode: hsCode || '',
      productName,
      quantity,
      originCountry,
      destinationCountry,
      deadlineDays,
      requirements: requirements ? JSON.stringify(requirements) : null,
      certifications: certifications ? JSON.stringify(certifications) : null,
      sector: finalSector,
      subcategory,
      postType: postType || type || 'buy',
      incoterm,
      price,
      currency: currency || 'USD',
      isEcological: isEcological || false,
      status: 'active',
      createdAt: new Date(),
      expiresAt: deadlineDays ? new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000) : null
    };
    
    const [created] = await db.insert(marketplacePosts).values(newPost).returning();
    
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating marketplace post:', error);
    res.status(500).json({ error: error.message });
  }
});
