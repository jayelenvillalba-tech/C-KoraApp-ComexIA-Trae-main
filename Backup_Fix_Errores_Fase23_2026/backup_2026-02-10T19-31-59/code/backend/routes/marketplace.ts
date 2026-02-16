import { Request, Response } from 'express';
import { MarketplacePost, User, Company } from '../models'; // Mongoose models

export async function getPosts(req: Request, res: Response) {
  try {
    const { type, country } = req.query;

    const filter: any = { status: 'active' };
    if (type && type !== 'all') {
        filter.type = type;
    }
    // TODO: Filter by country if needed (requires joining or denormalization if filtering by company country)
    // Post has originCountry, we can filter by that
    if (country) {
        filter.originCountry = country;
    }

    const posts = await MarketplacePost.find(filter)
      .sort({ createdAt: -1 })
      .populate('companyId', 'name country') // Populate company name and country
      .populate('userId', 'name verified'); // Populate user name and verified status

    // Format for frontend (flatten structure slightly if needed to match previous response)
    const formattedPosts = posts.map(p => {
        const company = p.companyId as any;
        const user = p.userId as any;
        
        // Ensure requirements/details are handled. 
        // In Mongoose model we rely on schema fields. The previous SQLite code parsed 'details' JSON.
        // Our Mongoose schema has specific fields like 'productName', 'price', etc.
        // We should return them directly.
        
        return {
            id: p._id, // Frontend expects 'id'
            type: p.type,
            productName: p.productName,
            hsCode: p.hsCode,
            quantity: p.quantity,
            originCountry: p.originCountry,
            description: p.descriptionLong || (p.requirements && p.requirements[0]), // Fallback
            createdAt: p.createdAt,
            companyName: company?.name || 'Unknown',
            companyCountry: company?.country || 'Unknown',
            userName: user?.name || 'Unknown',
            verified: user?.verified || false,
            // Add other fields needed by frontend
            price: p.price,
            currency: p.currency,
            photos: p.photos,
            incoterm: p.incoterm,
            postType: p.postType, // for social/trade distinction
            requirements: p.requirements,
            certifications: p.certifications,
            isEcological: p.isEcological
        };
    });

    res.json({ success: true, data: formattedPosts });

  } catch (error: any) {
    console.error('Error fetching marketplace posts:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function createPost(req: Request, res: Response) {
    try {
        const body = req.body;
        
        // In a real app we'd get userId from session/token (req.user)
        // For MVP compatibility with existing frontend calls that might not send token perfectly yet 
        // or just to match previous logic:
        
        // We need a user. If authenticated, usage req.user.id. 
        // But let's assume we maintain the behavior of "pick first user" if not auth, purely for dev speed?
        // NO, let's try to be better. But to avoid breaking, if req.user is missing, try to find a user.
        
        let userId = (req as any).user?.id;
        let companyId = (req as any).user?.companyId;
        
        if (!userId) {
            // Fallback for dev: find first user
            const user = await User.findOne();
            if (!user) return res.status(400).json({error: 'No users found'});
            userId = user._id;
            companyId = user.companyId;
        }

        const newPost = await MarketplacePost.create({
            companyId: companyId,
            userId: userId,
            type: body.postType || body.type || 'buy', // Frontend sends postType or type
            hsCode: body.hsCode,
            productName: body.productName || body.title, // Map frontend fields
            quantity: body.quantity,
            originCountry: body.originCountry || body.origin,
            destinationCountry: body.destinationCountry,
            price: body.price,
            currency: body.currency,
            incoterm: body.incoterm,
            requirements: body.requirements, // Array of strings or single string? Frontend sends array usually?
            // SQLite stored JSON string. Mongoose stores array of strings.
            // If body.requirements is string (from text area), wrap in array or split?
            // Frontend PostForm sends split array: requirements: formData.requirements.split(',')...
            // So it expects array
            certifications: body.certifications,
            
            // Phase 21 fields
            descriptionLong: body.descriptionLong || (Array.isArray(body.requirements) ? body.requirements.join(' ') : body.requirements),
            photos: body.photos,
            isEcological: body.isEcological,
            section: body.sector,
            subcategory: body.subcategory,
            
            status: 'active'
        });

        res.json({ success: true, data: newPost });

    } catch (error: any) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: error.message });
    }
}
