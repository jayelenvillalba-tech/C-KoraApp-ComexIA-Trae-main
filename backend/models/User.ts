import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  companyId?: string; // Reference to Company
  role?: string;
  primaryRole?: 'tecnico' | 'compras' | 'logistica' | 'admin';
  verified: boolean;
  phone?: string;
  lastActive?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  companyId: { type: String, ref: 'Company' }, // Using String ID to match SQLite migration or ObjectId?
  // Migration note: SQLite uses UUID strings. We can keep using String for _id or map to ObjectId.
  // For easiest migration, we'll use a custom _id field or just map the 'id' string to a field and let Mongo use ObjectId.
  // Better: Let's use the SQLite UUID as the _id if possible, or keep a separate 'sqliteId' field.
  // Mongoose allows string _id. Let's try to preserve IDs.
  role: String,
  primaryRole: { 
    type: String, 
    enum: ['tecnico', 'compras', 'logistica', 'admin'],
    default: 'tecnico'
  },
  verified: { type: Boolean, default: false },
  phone: String,
  lastActive: Date
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// We will handle ID migration in the script.
export const User = model<IUser>('User', userSchema);
