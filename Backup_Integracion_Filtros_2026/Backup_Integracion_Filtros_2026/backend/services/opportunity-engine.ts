
import { ExternalDataService } from './external-data';
import { RegulatoryDataService } from './regulatory-data';
import { HsClassifier } from './hs-classifier';

/**
 * Motor de Oportunidades Automatizado
 * 
 * Flujo:
 * 1. Clasificar producto (HS Code via AI)
 * 2. Escanear mercados globales (Top importadores)
 * 3. Obtener regulaciones por país
 * 4. Calcular Score: Demanda + Arancel + Facilidad
 * 5. Rankear y devolver Top N
 */
export class OpportunityEngineService {

  /**
   * Genera un reporte de oportunidades rankeadas
   */
  static async analyzeOpportunity(inputProduct: string, originCountry: string) {
    console.log(`🚀 OpportunityEngine: Starting analysis for "${inputProduct}" from ${originCountry}`);

    // 1. AI Classification
    const classification = await HsClassifier.classify(inputProduct);
    if (!classification) {
        throw new Error(`No se pudo clasificar el producto "${inputProduct}". Intenta ser más específico.`);
    }
    const hsCode = classification.code;
    console.log(`   ✅ Classified as HS ${hsCode} (${classification.description})`);

    // 2. Global Market Scan (Get Candidates)
    // Fetch global demand (Top 20 importers mainly)
    const marketRaw = await ExternalDataService.getTradeFlows(hsCode, originCountry);
    
    // Si no hay datos, fallar
    if (marketRaw.length === 0) return [];

    // Aggregate by destination
    const candidates = this.aggregateByDestination(marketRaw);

    // 3. Regulatory + Scoring
    const rankedOpportunities: any[] = [];

    for (const cand of candidates.slice(0, 10)) { // Top 10 candidates
        // cand.country is actually a country CODE from the database (e.g., "CN")
        const countryCode = cand.country; // Already a code!
        const countryName = this.getCountryName(countryCode); // Convert to name

        // Fetch Regulations
        const regs = await RegulatoryDataService.getRequirements(hsCode, countryCode);

        // Scoring
        const maxVolume = candidates[0].volume;
        const demandScore = (cand.volume / maxVolume) * 100;

        const tariffRate = regs.tariff.rate || 0;
        const tariffScore = Math.max(0, 100 - tariffRate * 2); // Lower tariff = higher score

        const docCount = regs.documents.length;
        const easeScore = Math.max(0, 100 - docCount * 5); // Fewer docs = easier

        const totalScore = (demandScore * 0.4) + (tariffScore * 0.3) + (easeScore * 0.3);

        // Landed Cost Estimation
        const fobPrice = (cand.value / cand.volume) || 1000; // USD per unit
        const logisticsCost = this.estimateLogistics(originCountry, countryName) * (cand.volume / 1000); // Simplificado
        const tariffCost = fobPrice * (tariffRate / 100);
        const landedCost = fobPrice + logisticsCost + tariffCost;

        rankedOpportunities.push({
            country: countryName, // Use the converted name
            countryCode,
            rank: 0, // will sort later
            score: Math.round(totalScore),
            details: {
                demandScore: Math.round(demandScore),
                tariffScore: Math.round(tariffScore),
                easeScore: Math.round(easeScore),
                landedCost: parseFloat(landedCost.toFixed(2))
            },
            marketData: {
                volume: cand.volume,
                value: cand.value,
                price: parseFloat(fobPrice.toFixed(2))
            },
            regulations: regs
        });
    }

    // Sort by score
    rankedOpportunities.sort((a, b) => b.score - a.score);

    return rankedOpportunities.map((op, idx) => ({ ...op, rank: idx + 1 }));
  }

  private static aggregateByDestination(data: any[]) {
      const map = new Map<string, { country: string, volume: number, value: number }>();
      
      for (const row of data) {
          const c = row.destinationCountry;
          if (!map.has(c)) {
              map.set(c, { country: c, volume: 0, value: 0 });
          }
          const item = map.get(c)!;
          item.volume += Number(row.volume);
          item.value += Number(row.valueUsd);
      }
      return Array.from(map.values()).sort((a, b) => b.volume - a.volume);
  }

   private static getCountryCode(name: string) {
        // Helper map simple (duplicated from route, should be shared util)
        const map: Record<string, string> = { 
            'China': 'CN', 
            'Estados Unidos': 'US', 
            'Brasil': 'BR', 
            'Alemania': 'DE',
            'Chile':'CL',
            'Corea del Sur': 'KR',
            'India': 'IN',
            'Japón': 'JP',
            'Reino Unido': 'GB',
            'Francia': 'FR',
            'Italia': 'IT',
            'Rusia': 'RU',
            'México': 'MX',
            'España': 'ES',
            'Australia': 'AU',
            'Canadá': 'CA'
        }; 
        return map[name] || 'XX';
   }

   private static getCountryName(code: string): string {
        // Reverse map: code -> name
        const map: Record<string, string> = {
            'CN': 'China',
            'US': 'Estados Unidos',
            'BR': 'Brasil',
            'DE': 'Alemania',
            'CL': 'Chile',
            'KR': 'Corea del Sur',
            'IN': 'India',
            'JP': 'Japón',
            'GB': 'Reino Unido',
            'FR': 'Francia',
            'IT': 'Italia',
            'RU': 'Rusia',
            'MX': 'México',
            'ES': 'España',
            'AU': 'Australia',
            'CA': 'Canadá'
        };
        return map[code] || code; // Fallback to code if not found
   }

   private static estimateLogistics(origin: string, dest: string) {
       // Muy simplificado: Intra-zona vs Extra-zona
       if ((origin === 'Argentina' && dest === 'Brasil') || (origin === 'Brasil' && dest === 'Argentina')) return 0.10; // USD/kg
       if (['China', 'Estados Unidos', 'Alemania'].includes(dest)) return 0.50; // USD/kg ocean
       return 0.30;
   }
}
