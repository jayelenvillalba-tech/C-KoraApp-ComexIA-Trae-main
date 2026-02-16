import { Schema, model, Document } from 'mongoose';

export interface IMarketplacePost extends Document {
  type: 'buy' | 'sell';
  companyId: string;
  userId: string;
  hsCode: string;
  productName: string;
  quantity?: string;
  price?: number;
  currency?: string;
  incoterm?: string;
  originCountry?: string;
  destinationCountry?: string;
  deadlineDays?: number;
  requirements?: string[];
  certifications?: string[];
  descriptionLong?: string;
  photos?: string[];
  moq?: string;
  inspectionAvailable: boolean;
  regionalContentPercentage?: number;
  tradePreferences?: any[];
  status: 'active' | 'closed';
  postType?: string;
  sector?: string;
  subcategory?: string;
  isEcological: boolean;
  expiresAt?: Date;
}

const marketplacePostSchema = new Schema({
  type: { type: String, required: true, enum: ['buy', 'sell'] },
  companyId: { type: String, ref: 'Company', required: true },
  userId: { type: String, ref: 'User', required: true },
  hsCode: { type: String, required: true, index: true },
  productName: { type: String, required: true },
  quantity: String,
  price: Number,
  currency: { type: String, default: 'USD' },
  incoterm: String,
  originCountry: String,
  destinationCountry: String,
  deadlineDays: Number,
  requirements: [String],
  certifications: [String],
  
  // Phase 21 Fields
  descriptionLong: String,
  photos: [String],
  moq: String,
  inspectionAvailable: { type: Boolean, default: false },
  regionalContentPercentage: Number,
  tradePreferences: [Schema.Types.Mixed],
  
  // Advanced filters
  postType: { type: String, default: 'buy' },
  sector: String,
  subcategory: String,
  isEcological: { type: Boolean, default: false },
  
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  expiresAt: Date
}, { timestamps: true });

// Text index for search
marketplacePostSchema.index({ productName: 'text', descriptionLong: 'text', hsCode: 'text' });

export const MarketplacePost = model<IMarketplacePost>('MarketplacePost', marketplacePostSchema);
