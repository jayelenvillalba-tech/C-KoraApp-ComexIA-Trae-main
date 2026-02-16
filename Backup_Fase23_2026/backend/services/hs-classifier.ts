
import { db } from '../../database/db-sqlite';
import { hsSubpartidas } from '../../shared/schema-sqlite';
import { like, or, sql } from 'drizzle-orm';

/**
 * Servicio de Clasificación Inteligente de HS Codes (AI Simulation)
 * En producción, esto usaría OpenAI/LangChain. 
 * Aquí usamos una búsqueda semántica simplificada (Keyword/Fuzzy Matching).
 */
export class HsClassifier {

  /**
   * Clasifica un input de texto a un HS Code válido.
   * @param query Texto o código (ej: "Vino", "2204", "Celulares")
   * @returns El HS Code más probable y su descripción
   */
  static async classify(query: string) {
    console.log(`🧠 AI Classifier: Analyzing "${query}"...`);

    // 1. Limpieza básica
    const term = query.trim();
    
    // 2. Si parece un código numérico directo, buscarlo
    if (/^\d{4,6}$/.test(term)) {
       const directMatch = await db.select().from(hsSubpartidas)
         .where(like(hsSubpartidas.code, `${term}%`))
         .limit(1);
         
       if (directMatch.length > 0) {
           return { 
               code: directMatch[0].code, 
               description: directMatch[0].description,
               confidence: 1.0 
           };
       }
    }

    // 3. Búsqueda Semántica (Simulada con SQL LIKE)
    // Buscamos matches en descripciones
    const matches = await db.select({
        code: hsSubpartidas.code,
        description: hsSubpartidas.description
    }).from(hsSubpartidas)
    .where(or(
        like(hsSubpartidas.description, `%${term}%`),
        like(hsSubpartidas.descriptionEn, `%${term}%`)
    ))
    .limit(1);

    if (matches.length > 0) {
        return {
            code: matches[0].code,
            description: matches[0].description,
            confidence: 0.85 // Simulado high confidence
        };
    }

    // 4. Fallback Intelligent Logic (Hardcoded rules for common aliases not in HS descriptions)
    const aliases: Record<string, string> = {
        'microchip': '8542',
        'chip': '8542',
        'coche': '8703',
        'auto': '8703',
        'soja': '1201',
        'litio': '280519',
        'bateria': '8507',
        'vacuna': '3002'
    };
    
    const aliasKey = Object.keys(aliases).find(k => term.toLowerCase().includes(k));
    if (aliasKey) {
        return {
            code: aliases[aliasKey],
            description: `AI Inference: ${aliasKey} mapped to HS`,
            confidence: 0.9
        };
    }

    // 5. No match
    return null;
  }
}
