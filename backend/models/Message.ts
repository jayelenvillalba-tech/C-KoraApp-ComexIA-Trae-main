import { Schema, model, Document } from 'mongoose';

export interface IMessage extends Document {
  conversationId: string;
  senderId: string;
  messageType: 'text' | 'quote' | 'document';
  content?: string;
  metadata?: any;
  readAt?: Date;
}

const messageSchema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true }, // Mongoose ObjectId for relation
  // Wait, migration might keep string IDs. Let's use String refs for flexibility during migration.
  // Actually, for new conversations we might want ObjectId. 
  // Let's stick to String ref for now to match other models.
  // BUT Mongoose populate works best with ObjectId or matching types.
  // If we migrate UUIDs as strings, we should use String here.
  // I will use String type for IDs to support the UUIDs from SQLite.
  senderId: { type: String, ref: 'User', required: true },
  messageType: { type: String, enum: ['text', 'quote', 'document'], default: 'text' },
  content: String,
  metadata: Schema.Types.Mixed,
  readAt: Date
}, { timestamps: true });

// Note: conversationId in SQLite is string UUID. 
// We are defining it as ObjectId in Schema above by mistake? No, I should use String if I want to keep UUIDs.
// Let's correct it to String.

// Correcting schema definition:
const messageSchemaFixed = new Schema({
  conversationId: { type: String, ref: 'Conversation', required: true },
  senderId: { type: String, ref: 'User', required: true },
  messageType: { type: String, enum: ['text', 'quote', 'document'], default: 'text' },
  content: String,
  metadata: Schema.Types.Mixed,
  readAt: Date
}, { timestamps: true });

export const Message = model<IMessage>('Message', messageSchemaFixed);
