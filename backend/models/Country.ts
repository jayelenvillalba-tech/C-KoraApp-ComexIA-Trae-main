import { Schema, model, Document } from 'mongoose';

export interface ICountry extends Document {
  code: string; // ISO 2
  name: string;
  nameEn: string;
  region?: string;
  flagUrl?: string;
  currency?: string;
  languages?: string;
  timezone?: string;
  baseRequirements?: {
    labeling?: string[];
    packaging?: string[];
    documents?: string[];
    processingTime?: number;
  };
}

const countrySchema = new Schema({
  code: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  nameEn: { type: String, required: true },
  region: String,
  flagUrl: String,
  currency: String,
  languages: String,
  timezone: String,
  baseRequirements: {
    labeling: [String],
    packaging: [String],
    documents: [String],
    processingTime: Number
  }
}, { timestamps: true });

export const Country = model<ICountry>('Country', countrySchema);
