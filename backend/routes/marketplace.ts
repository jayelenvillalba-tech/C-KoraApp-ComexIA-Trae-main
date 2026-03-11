import { Request, Response } from 'express';
import { MarketplacePost, User, Company } from '../models'; // Mongoose models
import { notificationService } from '../services/notification';

export async function getPosts(req: Request, res: Response) {
  try {
    const { type, country } = req.query;

    const filter: any = { status: 'active' };
    if (type && type !== 'all') {
        filter.type = type;
    }
    if (country) {
        filter.originCountry = country;
    }

    const posts = await MarketplacePost.find(filter)
      .sort({ createdAt: -1 })
      .populate('companyId', 'name country verificationLevel') 
      .populate('userId', 'name role verified');

    // Format for frontend
    const formattedPosts = posts.map(p => {
        // Handle nulls gracefully if refs are broken
        const company = p.companyId || {};
        const user = p.userId || {};
        
        return {
            id: p._id,
            type: p.type,
            productName: p.productName || 'Producto sin nombre',
            hsCode: p.hsCode || '',
            quantity: p.quantity,
            originCountry: p.originCountry,
            destinationCountry: p.destinationCountry,
            descriptionLong: p.descriptionLong || (p.requirements && p.requirements[0]),
            createdAt: p.createdAt,
            
            // Reconstruct nested objects expected by Frontend
            company: {
               id: (company as any)._id,
               name: (company as any).name || 'Empresa Anónima',
               country: (company as any).country || 'AR',
               verificationLevel: (company as any).verificationLevel || 'unverified',
               verified: (company as any).verificationLevel === 'verified' || (company as any).verificationLevel === 'premium'
            },
            user: {
               id: (user as any)._id,
               name: (user as any).name || 'Usuario',
               role: (user as any).role || 'Trader',
               verified: (user as any).verified || false
            },
            
            price: p.price,
            currency: p.currency,
            photos: p.photos || [],
            incoterm: p.incoterm,
            postType: p.postType,
            requirements: p.requirements || [],
            certifications: p.certifications || [],
            isEcological: p.isEcological
        };
    });

    res.json({ success: true, data: formattedPosts });

  } catch (error: any) {
    console.error('Error fetching marketplace posts:', error);
    // Even on error, return an empty array format so frontend doesn't crash on filter
    res.status(500).json({ success: false, error: error.message, data: [] });
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

        // Send Notifications to Interested Users (Async)
        // Find users who have this HS Code in their interested list
        // Note: verify if interestedHSCodes is string or array in User model update
        User.find({ interestedHSCodes: body.hsCode })
            .then(users => {
                console.log(`Found ${users.length} users interested in HS Code ${body.hsCode}`);
                users.forEach(user => {
                    notificationService.sendNewOpportunityAlert(newPost, user)
                        .catch(err => console.error(`Failed to send alert to ${user.email}:`, err));
                });
            })
            .catch(err => console.error('Error finding interested users:', err));

    } catch (error: any) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: error.message });
    }
}
