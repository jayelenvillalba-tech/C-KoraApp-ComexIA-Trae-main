
import { db } from '../../database/db-sqlite';
import { countryRequirements, countryOpportunities } from '../../shared/schema-sqlite';
import { eq, and, like } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * Servicio de Inteligencia Regulatoria Universal
 * Simula la obtención de leyes, normativas y requisitos de acceso a mercados
 * integrando fuentes como OMC (ePing), ITC (MacMap) y UNCTAD.
 */
export class RegulatoryDataService {

  /**
   * Obtiene requisitos regulatorios completos para un Producto + País
   * @param hsCode Código HS (ej: '020230')
   * @param destinationCountry Código ISO del país destino (ej: 'CN')
   */
  static async getRequirements(hsCode: string, destinationCountry: string) {
    console.log(`⚖️  RegulatoryService: Fetching Laws for HS ${hsCode} to ${destinationCountry}`);

    // 1. Check Local Cache
    // (Simplificación MVP: Consultamos si ya existe, si no, generamos)
    // En producción real esto miraría una tabla cacheada con TTL.
    
    // 2. "Live Fetch" Simulation (Rules Engine)
    const regulations = this.simulateLegalIntelligence(hsCode, destinationCountry);
    
    return regulations;
  }

  /**
   * Motor de Reglas Regulatorias (Simula la complejidad del mundo real)
   * Asigna leyes basadas en la naturaleza del producto y el destino.
   */
  private static simulateLegalIntelligence(hsCode: string, country: string) {
    const chapter = hsCode.substring(0, 2);
    const countryCode = country.toUpperCase();
    
    let requirements = {
        tariff: { rate: 0, type: 'MFN', agreement: null as string | null },
        nonTariffMeasures: [] as string[],
        documents: [] as { name: string, type: string, importance: string }[],
        restrictions: [] as string[]
    };

    // --- A. ARANCELES (TARIFFS) ---
    // Reglas básicas de tratados conocidos
    if (['US', 'CL', 'BR', 'MX'].includes(countryCode)) {
        requirements.tariff.rate = 0;
        requirements.tariff.agreement = 'Free Trade Agreement (Preferential)';
    } else if (countryCode === 'CN') {
        requirements.tariff.rate = 5.0; // Promedio China
        requirements.tariff.type = 'MFN';
    } else if (['DE', 'FR', 'ES', 'IT', 'NL'].includes(countryCode)) {
        requirements.tariff.agreement = 'GSP / EU Agreement'; // Generalizado
        requirements.tariff.rate = 2.5; 
    } else {
        requirements.tariff.rate = 12.0; // Default WTO Bound Rate
    }

    // --- B. MEDIDAS NO ARANCELARIAS (NTMs) & DOCUMENTOS ---
    const baseDocs = [
        { name: 'Commercial Invoice', type: 'Commercial', importance: 'Mandatory' },
        { name: 'Packing List', type: 'Logistics', importance: 'Mandatory' },
        { name: 'Bill of Lading / Airway Bill', type: 'Transport', importance: 'Mandatory' },
        { name: 'Certificate of Origin', type: 'Customs', importance: 'Mandatory' }
    ];
    requirements.documents.push(...baseDocs);

    // Reglas por Sector (Capítulo HS)
    
    // 1. ALIMENTOS Y ANIMALES (Caps 01-24)
    if (parseInt(chapter) <= 24) {
        requirements.nonTariffMeasures.push('SPS (Sanitary & Phytosanitary Measures)');
        
        if (['01', '02', '03', '04', '05', '16'].includes(chapter)) {
            // Animal Products
            requirements.documents.push({ name: 'Veterinary Health Certificate', type: 'Sanitary', importance: 'Critical' });
            requirements.restrictions.push('Plant/Establishment Approval Required');
            if (countryCode === 'CN') requirements.restrictions.push('GACC Registration (China Decrees 248/249)');
            if (countryCode === 'US') requirements.documents.push({ name: 'FSIS Inspection Certificate', type: 'Sanitary', importance: 'Mandatory' });
        } else {
            // Plant Products (06-14)
            requirements.documents.push({ name: 'Phytosanitary Certificate', type: 'Sanitary', importance: 'Critical' });
            requirements.nonTariffMeasures.push('Fumigation Requirement');
        }

        // Etiquetado
        requirements.nonTariffMeasures.push('TBT (Technical Barriers to Trade) - Labeling');
        if (countryCode === 'US') requirements.documents.push({ name: 'FDA Prior Notice', type: 'Security', importance: 'Mandatory' });
    }
    
    // 2. QUÍMICOS Y FARMACIA (Caps 28-38)
    else if (parseInt(chapter) >= 28 && parseInt(chapter) <= 38) {
        requirements.nonTariffMeasures.push('Chemical Safety Registration');
        requirements.documents.push({ name: 'Safety Data Sheet (SDS)', type: 'Technical', importance: 'Critical' });
        
        if (chapter === '30') { // Farma
            requirements.documents.push({ name: 'GMP Certificate', type: 'Health', importance: 'Critical' });
            requirements.documents.push({ name: 'Marketing Authorization', type: 'Health', importance: 'Mandatory' });
            if (['DE', 'FR', 'ES', 'IT', 'NL'].includes(countryCode)) requirements.restrictions.push('EMA Centralized Procedure');
            if (countryCode === 'US') requirements.restrictions.push('FDA NDA/ANDA Approval');
        }
    }

    // 3. MANUFACTURAS / TECH (Caps 84-85)
    else if (['84', '85', '87', '90'].includes(chapter)) {
        requirements.nonTariffMeasures.push('Technical Safety Standards');
        
        if (['DE', 'FR', 'ES', 'IT', 'NL'].includes(countryCode)) {
            requirements.documents.push({ name: 'CE Declaration of Conformity', type: 'Technical', importance: 'Mandatory' });
            requirements.nonTariffMeasures.push('RoHS Directive Compliance');
            requirements.nonTariffMeasures.push('WEEE Directive (E-Waste)');
        }
        if (countryCode === 'US') {
            requirements.documents.push({ name: 'FCC Certification', type: 'Technical', importance: 'Conditional' });
        }
        if (countryCode === 'CN') {
            requirements.documents.push({ name: 'CCC Certificate (China Compulsory Certification)', type: 'Technical', importance: 'Mandatory' });
        }
    }

    // 4. MINERALES / ARMAS / ORO (Sensibles)
    else if (['27', '71', '93'].includes(chapter)) {
        requirements.restrictions.push('Export License Required (Strategic Goods)');
        requirements.documents.push({ name: 'End-User Certificate', type: 'Security', importance: 'Mandatory' });
    }

    return requirements;
  }
}
