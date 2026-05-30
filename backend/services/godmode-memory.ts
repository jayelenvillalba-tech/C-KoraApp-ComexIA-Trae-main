import { db } from '../../database/db-sqlite';
import { godmodeConversations, godmodeMessages } from '../../shared/schema-sqlite';
import { eq, desc, asc } from 'drizzle-orm';
import crypto from 'crypto';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class GodModeMemoryService {
  /**
   * Obtiene o crea una sesión de conversación.
   */
  static async getOrCreateSession(sessionId: string, userId?: string) {
    let conv = await db.select()
      .from(godmodeConversations)
      .where(eq(godmodeConversations.sessionId, sessionId))
      .limit(1);

    if (conv.length > 0) {
      return conv[0];
    }

    const newId = crypto.randomUUID();
    await db.insert(godmodeConversations).values({
      id: newId,
      sessionId,
      userId: userId || null,
      title: 'Nueva Conversación',
    });

    const newConv = await db.select()
      .from(godmodeConversations)
      .where(eq(godmodeConversations.id, newId))
      .limit(1);

    return newConv[0];
  }

  /**
   * Recupera el historial de mensajes de la sesión para dar contexto a la IA.
   */
  static async getHistory(conversationId: string, limit: number = 10): Promise<ChatMessage[]> {
    const messages = await db.select()
      .from(godmodeMessages)
      .where(eq(godmodeMessages.conversationId, conversationId))
      .orderBy(desc(godmodeMessages.createdAt))
      .limit(limit);

    // Retornamos en orden cronológico (más antiguo primero)
    return messages.reverse().map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content
    }));
  }

  /**
   * Guarda un nuevo mensaje en el historial.
   */
  static async addMessage(conversationId: string, role: 'user' | 'assistant' | 'system', content: string) {
    await db.insert(godmodeMessages).values({
      conversationId,
      role,
      content,
    });

    // Actualizamos la fecha de la conversación
    await db.update(godmodeConversations)
      .set({ updatedAt: new Date() })
      .where(eq(godmodeConversations.id, conversationId));
  }

  /**
   * Obtiene el contexto resumido.
   */
  static async getSummary(conversationId: string): Promise<string | null> {
    const conv = await db.select()
      .from(godmodeConversations)
      .where(eq(godmodeConversations.id, conversationId))
      .limit(1);
    
    return conv[0]?.contextSummary || null;
  }

  /**
   * Actualiza el resumen del contexto.
   */
  static async updateSummary(conversationId: string, summary: string) {
    await db.update(godmodeConversations)
      .set({ contextSummary: summary, updatedAt: new Date() })
      .where(eq(godmodeConversations.id, conversationId));
  }
}
