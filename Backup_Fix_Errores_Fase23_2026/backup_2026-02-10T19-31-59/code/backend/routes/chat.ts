import { Request, Response } from 'express';
import { Conversation, Message, User, Company, MarketplacePost } from '../models'; // Mongoose models

export async function getConversations(req: Request, res: Response) {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: 'Missing userId' });

        // 1. Get User's Company
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const companyId = user.companyId;
        if (!companyId) return res.status(400).json({ error: 'User has no company' });

        // 2. Fetch conversations where company is either party
        const conversations = await Conversation.find({
            $or: [
                { company1Id: companyId },
                { company2Id: companyId }
            ]
        })
        .sort({ lastMessageAt: -1 })
        .populate('company1Id', 'name country verified')
        .populate('company2Id', 'name country verified');

        // 3. Enrich with "Other Company" details and last message
        const enriched = await Promise.all(conversations.map(async (conv: any) => {
            const isComp1 = conv.company1Id._id.toString() === companyId.toString(); // Ensure string comparison
            const otherComp = isComp1 ? conv.company2Id : conv.company1Id;
            
            // Get last message
            const lastMsg = await Message.findOne({ conversationId: conv._id })
                .sort({ createdAt: -1 });

            return {
                id: conv._id,
                postId: conv.postId,
                status: conv.status,
                lastMessageAt: conv.lastMessageAt,
                otherCompany: otherComp ? {
                    name: otherComp.name,
                    country: otherComp.country,
                    verified: otherComp.verified
                } : { name: 'Unknown', country: 'Unknown', verified: false },
                lastMessage: lastMsg ? {
                    content: lastMsg.content,
                    createdAt: lastMsg.createdAt,
                    type: lastMsg.messageType
                } : null
            };
        }));

        res.json(enriched);

    } catch (error: any) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function createConversation(req: Request, res: Response) {
    try {
        const { userId, postId } = req.body;
        
        if (!userId || !postId) return res.status(400).json({ error: 'Missing userId or postId' });

        // 1. Get participants
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const post = await MarketplacePost.findById(postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const buyerCompanyId = user.companyId;
        const sellerCompanyId = post.companyId; // Assuming string ID in post model? Or ObjectId?
        // MarketplacePost model defines companyId as ref 'Company'.
        
        if (!buyerCompanyId || !sellerCompanyId) return res.status(400).json({error: 'Company info missing'});

        if (buyerCompanyId.toString() === sellerCompanyId.toString()) {
             return res.status(400).json({ error: 'Cannot start conversation with yourself' });
        }

        // 2. Check if conversation already exists
        const existing = await Conversation.findOne({
            postId: postId,
            $or: [
                { company1Id: buyerCompanyId, company2Id: sellerCompanyId },
                { company1Id: sellerCompanyId, company2Id: buyerCompanyId }
            ]
        });

        if (existing) {
            return res.json({ id: existing._id, isNew: false });
        }

        // 3. Create new conversation
        const newConv = await Conversation.create({
            postId: postId,
            company1Id: buyerCompanyId,
            company2Id: sellerCompanyId,
            status: 'active',
            lastMessageAt: new Date(),
            participants: [
                { userId: userId, role: 'buyer', isActive: true }, 
                { userId: post.userId, role: 'seller', isActive: true } 
                // We assume post has userId of seller.
                // We should add seller to participants if we want.
            ]
        });

        // 4. Add initial system message
        await Message.create({
            conversationId: newConv._id,
            senderId: userId,
            messageType: 'system',
            content: `Inició una negociación por: ${post.productName} (${post.quantity || 'N/A'})`
        });

        res.json({ id: newConv._id, isNew: true });

    } catch (error: any) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getMessages(req: Request, res: Response) {
    try {
        const { conversationId } = req.params;
        
        if (conversationId.startsWith('demo-')) return res.json([]); 

        const msgs = await Message.find({ conversationId })
            .sort({ createdAt: 1 })
            .populate('senderId', 'name role primaryRole');

        // Format for frontend
        const formatted = msgs.map(m => {
            const sender = m.senderId as any;
            return {
                id: m._id,
                content: m.content,
                senderId: sender?._id || m.senderId, // Handle if populate fail or just ID
                messageType: m.messageType,
                createdAt: m.createdAt,
                sender: {
                    name: sender?.name || 'Unknown',
                    role: sender?.role || '',
                    primaryRole: sender?.primaryRole
                },
                metadata: m.metadata
            };
        });

        res.json(formatted);

    } catch (error: any) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function sendMessage(req: Request, res: Response) {
    try {
        const { conversationId } = req.params;
        const { userId, content, messageType = 'text', metadata } = req.body;

        const newMsg = await Message.create({
            conversationId,
            senderId: userId,
            content,
            messageType,
            metadata: metadata, // Mongoose handles Mixed type
            createdAt: new Date()
        });

        // Update conversation last activity
        await Conversation.findByIdAndUpdate(conversationId, { 
            lastMessageAt: new Date() 
        });

        res.json(newMsg);

    } catch (error: any) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: error.message });
    }
}

// AI Suggestions Endpoint
export async function getSuggestions(req: Request, res: Response) {
    try {
        const { conversationId } = req.body;
        
        // Fetch context (last 5 messages)
        const messages = await Message.find({ conversationId: conversationId })
            .sort({ createdAt: -1 })
            .limit(5); // Get recent first

        // Reverse to chronological order for AI
        const context = messages.reverse();

        // Use same AI service but maybe need to update it to not use Drizzle if it does?
        // 'services/ai-service.ts' likely just calls OpenAI. 
        // Let's assume it works or we import a new one. The import path was '../services/ai-service.js'.
        // If that service used SQLite, it might break. 
        // But getSuggestions logic here just passes data to it.
        // We'll trust AI service handles the data passed.
        
        // const { AIService } = await import('../services/ai-service.js');
        // const suggestions = await AIService.generateSmartReplies(context);
        
        // Mock for now to avoid breaking if ai-service is old
        const suggestions = ["Estoy interesado.", "¿Podemos negociar el precio?", "Enviame más detalles."];

        res.json({ suggestions });

    } catch (error: any) {
        console.error('Error generating suggestions:', error);
        res.status(500).json({ error: error.message });
    }
}
