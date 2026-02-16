import { Schema, model, Document } from 'mongoose';

export interface IConversation extends Document {
  postId?: string;
  company1Id: string;
  company2Id: string;
  status: 'active' | 'archived';
  lastMessageAt?: Date;
  participants: Array<{
    userId: string;
    role: string;
    accessLevel: string;
    isActive: boolean;
  }>;
}

const conversationSchema = new Schema({
  postId: { type: String, ref: 'MarketplacePost' },
  company1Id: { type: String, ref: 'Company', required: true },
  company2Id: { type: String, ref: 'Company', required: true },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  lastMessageAt: Date,
  participants: [{
    userId: { type: String, ref: 'User' },
    role: String,
    accessLevel: { type: String, default: 'full' },
    isActive: { type: Boolean, default: true }
  }]
}, { timestamps: true });

conversationSchema.index({ company1Id: 1, company2Id: 1 });

export const Conversation = model<IConversation>('Conversation', conversationSchema);
