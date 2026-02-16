import { Schema, model, Document } from 'mongoose';

export interface IRegulation extends Document {
  hsChapter?: string;
  countryCode?: string;
  originCountryCode?: string;
  documentName: string;
  issuer?: string;
  description?: string;
  requirements?: string;
  priority: number;
}

const regulationSchema = new Schema({
  hsChapter: String,
  countryCode: String,
  originCountryCode: String,
  documentName: { type: String, required: true },
  issuer: String,
  description: String,
  requirements: String,
  priority: { type: Number, default: 0 }
}, { timestamps: true });

export const Regulation = model<IRegulation>('Regulation', regulationSchema);
