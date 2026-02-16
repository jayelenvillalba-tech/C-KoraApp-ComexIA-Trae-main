import { Schema, model, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  country: string;
  type: string;
  products?: string[];
  verified: boolean;
  contactEmail?: string;
  website?: string;
  legalName?: string;
  taxId?: string;
  businessType?: string;
  establishedYear?: number;
  employeeCount?: number;
  annualRevenue?: number;
  creditRating?: string;
  riskScore?: number;
  paymentTerms?: string;
  // Stats
  totalTransactions?: number;
  averageOrderValue?: number;
  onTimeDeliveryRate?: number;
  certifications?: string[];
  sanctions: boolean;
  // Contact
  contactPerson?: string;
  phone?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
}

const companySchema = new Schema({
  name: { type: String, required: true },
  country: { type: String, required: true },
  type: { type: String, required: true }, // importer, exporter, both
  products: [String],
  verified: { type: Boolean, default: false },
  contactEmail: String,
  website: String,
  legalName: String,
  taxId: String,
  businessType: String,
  establishedYear: Number,
  employeeCount: Number,
  annualRevenue: Number,
  creditRating: String,
  riskScore: Number,
  paymentTerms: String,
  totalTransactions: Number,
  averageOrderValue: Number,
  onTimeDeliveryRate: Number,
  certifications: [String],
  sanctions: { type: Boolean, default: false },
  contactPerson: String,
  phone: String,
  address: String,
  coordinates: {
    lat: Number,
    lng: Number
  }
}, { timestamps: true });

export const Company = model<ICompany>('Company', companySchema);
