import { Schema, model, Document } from 'mongoose';

export interface IHSCode extends Document {
  code: string;
  description: string;
  descriptionEn: string;
  partidaCode: string; // 4-digit
  chapterCode: string; // 2-digit
  sectionCode?: string; // Roman numeral
  tariffRate?: number;
  specialTariffRate?: number;
  units?: string[];
  restrictions?: string[];
  keywords?: string[];
  isActive: boolean;
  notes?: string;
  notesEn?: string;
  // AI fields
  aiExamples?: Array<{ description: string; confidence: number }>;
}

const hsCodeSchema = new Schema({
  code: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true },
  descriptionEn: { type: String, required: true },
  partidaCode: { type: String, required: true, index: true },
  chapterCode: { type: String, required: true, index: true },
  sectionCode: String,
  tariffRate: Number,
  specialTariffRate: Number,
  units: [String],
  restrictions: [String],
  keywords: [String],
  isActive: { type: Boolean, default: true },
  notes: String,
  notesEn: String,
  
  // AI Training Data / Examples for vector search or fine-tuning
  aiExamples: [{
    description: String,
    confidence: Number
  }]
}, { timestamps: true });

// Text index for AI search and keyword search
hsCodeSchema.index({ 
  description: 'text', 
  descriptionEn: 'text', 
  keywords: 'text',
  code: 'text'
}, {
  weights: {
    code: 10,
    description: 5,
    descriptionEn: 5,
    keywords: 3
  }
});

export const HSCode = model<IHSCode>('HSCode', hsCodeSchema);
