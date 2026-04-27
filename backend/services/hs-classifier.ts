
import { getDb } from '../../database/db-sqlite';
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
    
    const db = getDb();
    if (!db) {
       console.warn('[HsClassifier] DB not initialized yet, falling back to keywords');
       // Fallback logic handled below
    }

    // 1. Limpieza básica
    const term = query.trim();
    
    // 2. Si parece un código numérico directo, buscarlo
    if (/^\d{4,6}$/.test(term)) {
       // Si hay DB, intentamos enriquecer con la descripción real
       if (db?.select) {
           try {
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
           } catch (e) {
               console.warn('[HsClassifier] DB Query failed, returning raw code', e);
           }
       }
       
       // Si no hay DB o no se encontró, devolvemos el código directo (Essential Fix para UN Comtrade)
       return { 
           code: term.substring(0, 6), // Limitar a max 6 chars (subpartida)
           description: `Partida ${term}`,
           confidence: 0.9 
       };
    }

    // 3. Búsqueda Semántica (Simulada con SQL LIKE)
    if (db?.select) {
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
    }

    // 4. Fallback: Comprehensive product keyword dictionary
    const KEYWORD_MAP: Record<string, { code: string; desc: string }> = {
      // Agro
      'soja': { code: '1201', desc: 'Soja' }, 'soya': { code: '1201', desc: 'Soja' }, 'soybean': { code: '1201', desc: 'Soybean' },
      'trigo': { code: '1001', desc: 'Trigo' }, 'wheat': { code: '1001', desc: 'Wheat' },
      'maiz': { code: '1005', desc: 'Maíz' }, 'maíz': { code: '1005', desc: 'Maíz' }, 'corn': { code: '1005', desc: 'Corn' },
      'cebada': { code: '1003', desc: 'Cebada' }, 'barley': { code: '1003', desc: 'Barley' },
      'arroz': { code: '1006', desc: 'Arroz' }, 'rice': { code: '1006', desc: 'Rice' },
      'harina': { code: '1101', desc: 'Harina de trigo' }, 'flour': { code: '1101', desc: 'Wheat flour' },
      // Aceites
      'aceite': { code: '1507', desc: 'Aceite vegetal' }, 'oil': { code: '1507', desc: 'Vegetable oil' },
      'girasol': { code: '1512', desc: 'Aceite de girasol' }, 'sunflower': { code: '1512', desc: 'Sunflower oil' },
      // Carne
      'carne': { code: '0201', desc: 'Carne bovina' }, 'beef': { code: '0201', desc: 'Beef' },
      'cerdo': { code: '0203', desc: 'Carne de cerdo' }, 'pork': { code: '0203', desc: 'Pork' },
      'pollo': { code: '0207', desc: 'Carne de pollo' }, 'chicken': { code: '0207', desc: 'Chicken' },
      'pescado': { code: '0302', desc: 'Pescado fresco' }, 'fish': { code: '0302', desc: 'Fish' },
      // Frutas/Verduras
      'manzana': { code: '0808', desc: 'Manzanas' }, 'apple': { code: '0808', desc: 'Apples' },
      'pera': { code: '0808', desc: 'Peras' }, 'limon': { code: '0805', desc: 'Limones' }, 'lemon': { code: '0805', desc: 'Lemons' },
      'uva': { code: '0806', desc: 'Uvas' }, 'grape': { code: '0806', desc: 'Grapes' },
      'mani': { code: '1202', desc: 'Maní' }, 'peanut': { code: '1202', desc: 'Peanuts' },
      // Bebidas
      'vino': { code: '2204', desc: 'Vinos' }, 'wine': { code: '2204', desc: 'Wine' },
      'cerveza': { code: '2203', desc: 'Cerveza' }, 'beer': { code: '2203', desc: 'Beer' },
      'jugo': { code: '2009', desc: 'Jugo de frutas' }, 'juice': { code: '2009', desc: 'Fruit juice' },
      // Minerales/Metales
      'litio': { code: '2805', desc: 'Litio' }, 'lithium': { code: '2805', desc: 'Lithium' },
      'cobre': { code: '7401', desc: 'Cobre' }, 'copper': { code: '7401', desc: 'Copper' },
      'hierro': { code: '7201', desc: 'Hierro' }, 'iron': { code: '7201', desc: 'Iron' },
      'aluminio': { code: '7601', desc: 'Aluminio' }, 'aluminum': { code: '7601', desc: 'Aluminum' },
      'oro': { code: '7108', desc: 'Oro' }, 'gold': { code: '7108', desc: 'Gold' },
      'petroleo': { code: '2709', desc: 'Petróleo' }, 'petróleo': { code: '2709', desc: 'Petróleo' }, 'petroleum': { code: '2709', desc: 'Petroleum' },
      // Tecnología
      'celular': { code: '8517', desc: 'Teléfonos' }, 'telefono': { code: '8517', desc: 'Teléfonos' }, 'phone': { code: '8517', desc: 'Phones' },
      'computadora': { code: '8471', desc: 'Computadoras' }, 'laptop': { code: '8471', desc: 'Computers' }, 'computer': { code: '8471', desc: 'Computers' },
      'auto': { code: '8703', desc: 'Vehículos' }, 'coche': { code: '8703', desc: 'Automóviles' }, 'car': { code: '8703', desc: 'Cars' },
      'moto': { code: '8711', desc: 'Motocicletas' }, 'motorcycle': { code: '8711', desc: 'Motorcycles' },
      'maquinaria': { code: '8479', desc: 'Maquinaria' }, 'machinery': { code: '8479', desc: 'Machinery' },
      'microchip': { code: '8542', desc: 'Circuitos' }, 'chip': { code: '8542', desc: 'Chips' },
      'bateria': { code: '8507', desc: 'Baterías' }, 'battery': { code: '8507', desc: 'Batteries' },
      // Químicos/Farma
      'vacuna': { code: '3002', desc: 'Vacunas' }, 'vaccine': { code: '3002', desc: 'Vaccines' },
      'medicamento': { code: '3004', desc: 'Medicamentos' }, 'medicine': { code: '3004', desc: 'Medicine' },
      'fertilizante': { code: '3102', desc: 'Fertilizantes' }, 'fertilizer': { code: '3102', desc: 'Fertilizer' },
      // Textiles/Ropa
      'ropa': { code: '6201', desc: 'Prendas de vestir' }, 'clothing': { code: '6201', desc: 'Clothing' },
      'cuero': { code: '4107', desc: 'Cuero' }, 'leather': { code: '4107', desc: 'Leather' },
      'calzado': { code: '6401', desc: 'Calzado' }, 'shoes': { code: '6401', desc: 'Shoes' },
    };

    const termLower = term.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const [keyword, data] of Object.entries(KEYWORD_MAP)) {
      const kwNorm = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (termLower.includes(kwNorm)) {
        return { code: data.code, description: data.desc, confidence: 0.8 };
      }
    }

    // 5. Last resort: return generic "Mercancías diversas" rather than null
    console.warn(`[HsClassifier] No match for "${query}" — using generic HS 9999`);
    return { code: '0100', description: `Producto: ${term}`, confidence: 0.3 };
  }
}
