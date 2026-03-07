import express from 'express';
import { MarketplacePost, User } from '../models';

const router = express.Router();

/**
 * Webhook: New marketplace post created
 * Triggered after a new post is created
 * n8n can use this to send notifications to interested users
 */
router.post('/marketplace-post-created', async (req, res) => {
  try {
    const { postId } = req.body;
    
    if (!postId) {
      return res.status(400).json({ error: 'postId is required' });
    }

    const post = await MarketplacePost.findById(postId)
      .populate('userId', 'email name')
      .populate('companyId', 'name country');
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Return data for n8n to process
    res.json({
      success: true,
      post: {
        id: post._id,
        productName: post.productName,
        hsCode: post.hsCode,
        type: post.type,
        originCountry: post.originCountry,
        destinationCountry: post.destinationCountry,
        quantity: post.quantity,
        company: {
          name: post.companyId?.name,
          country: post.companyId?.country
        },
        user: {
          email: post.userId?.email,
          name: post.userId?.name
        },
        createdAt: post.createdAt
      }
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Webhook: User registered
 * Triggered after a new user completes registration
 * n8n can use this for onboarding emails
 */
router.post('/user-registered', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await User.findById(userId).populate('companyId', 'name');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.companyId?.name,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Webhook: Critical error occurred
 * Triggered when a critical error happens in the system
 * n8n can use this to alert admins
 */
router.post('/critical-error', async (req, res) => {
  try {
    const { error, context, severity, timestamp } = req.body;
    
    res.json({
      success: true,
      alert: {
        error: error || 'Unknown error',
        context: context || {},
        severity: severity || 'critical',
        timestamp: timestamp || new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Webhook: Document status changed
 * Triggered when a document verification status changes
 * n8n can use this to notify users
 */
router.post('/document-status-changed', async (req, res) => {
  try {
    const { userId, documentType, status, message } = req.body;
    
    const user = await User.findById(userId);
    
    res.json({
      success: true,
      notification: {
        user: {
          id: user?._id,
          email: user?.email,
          name: user?.name
        },
        documentType,
        status,
        message,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
