
import { Schema, model, Document } from 'mongoose';

export interface INewsItem extends Document {
  title: string;
  summary: string;
  content?: string;
  fullUrl: string;
  source: string; // e.g., 'WTO', 'USDA', 'EU Commission'
  sourceType: 'official' | 'news'; // We strictly use 'official' per user request
  publishedDate: Date;
  
  // Contextual Tags
  hsCodes: string[]; // ['1001', '2204']
  countries: string[]; // ['AR', 'CN', 'NG']
  regions: string[]; // ['Africa', 'EU']
  treaties: string[]; // ['AfCFTA', 'EUDR', 'USMCA']
  laws: string[]; // ['GDPR', 'REACH']
  
  type: 'critical' | 'warning' | 'info' | 'opportunity';
  tags: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

const newsItemSchema = new Schema({
  title: { type: String, required: true },
  summary: { type: String, required: true },
  content: String,
  fullUrl: { type: String, required: true, unique: true },
  source: { type: String, required: true },
  sourceType: { type: String, default: 'official' },
  publishedDate: { type: Date, default: Date.now },
  
  hsCodes: [String],
  countries: [String],
  regions: [String],
  treaties: [String],
  laws: [String],
  
  type: { type: String, enum: ['critical', 'warning', 'info', 'opportunity'], default: 'info' },
  tags: [String]
}, { timestamps: true });

// Indexes for fast filtering
newsItemSchema.index({ hsCodes: 1 });
newsItemSchema.index({ countries: 1 });
newsItemSchema.index({ treaties: 1 });
newsItemSchema.index({ publishedDate: -1 });
newsItemSchema.index({ title: 'text', summary: 'text' });

export const NewsItem = model<INewsItem>('NewsItem', newsItemSchema);
