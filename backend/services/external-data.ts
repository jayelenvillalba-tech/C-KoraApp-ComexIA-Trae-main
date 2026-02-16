
import { db } from '../../database/db-sqlite';
import { marketData } from '../../shared/schema-sqlite';
import { eq, and, like, desc, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * Servicio para obtener datos externos reales (UN Comtrade, WB, etc.)
 * Implementa estrategia: Check DB -> Fetch External -> Save to DB -> Return
 */
export class ExternalDataService {
  
  /**
   * Obtiene flujos comerciales reales para un producto y país
   * @param hsCode Código HS (ej: '1001')
   * @param originCountry País de origen (ej: 'Argentina')
   * @param forceRefresh Si es true, ignora la caché local
   */
  static async getTradeFlows(hsCode: string, originCountry: string, forceRefresh = false) {
    console.log(`🌍 ExternalDataService: Requesting flows for HS ${hsCode} from ${originCountry}`);

    // 1. Check Local DB Cache
    const cachedData = await this.getChedData(hsCode, originCountry);
    
    // Si tenemos datos recientes y no forzamos refresh, devolver caché
    if (!forceRefresh && cachedData.length > 0) {
      console.log(`✅ Cache HIT: Found ${cachedData.length} records in local DB.`);
      return cachedData;
    }

    console.log('⚠️  Cache MISS: Fetching from External API (Mock/Real)...');
    
    // 2. Fetch External Data
    const realData = await this.fetchComtradeData(hsCode, originCountry);

    // 3. Save to DB (Ingestion)
    if (realData.length > 0) {
      await this.saveToDatabase(realData);
    }

    return realData;
  }

  /**
   * Lógica para consultar API externa (Simulado por ahora hasta tener keys)
   * En el futuro aquí llamaremos a UN Comtrade API v2
   */
  private static async fetchComtradeData(hsCode: string, originCountry: string) {
    // TODO: Implement actual HTTP call to https://comtradeapi.un.org/data/v1/get
    // Constante simulation por ahora para demostrar el flujo "Real Time"
    console.log('🔌 Connecting to Global Trade Network...');
    
    // Simulating API Latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generar datos "Reales" basados en reglas lógicas si no hay API key
    // NOTA: Esto se reemplazará por fetch real.
    
    const timestamp = new Date();
    const source = 'comtrade_simulated';
    
    // Ejemplo: Si es Litio (2805), compradores son China, Corea, Japón
    // Si es Carne (0202), China, Alemania, Israel
    
    let mockFlows = [];
    
    if (hsCode.startsWith('10')) { // Cereales
       mockFlows = [
         { destination: 'Brasil', volume: 6000000, value: 1800000000 },
         { destination: 'China', volume: 4000000, value: 1200000000 },
         { destination: 'Indonesia', volume: 3000000, value: 900000000 },
         { destination: 'Vietnam', volume: 2500000, value: 750000000 }
       ];
    } else if (hsCode.startsWith('02')) { // Carne
       mockFlows = [
         { destination: 'China', volume: 500000, value: 2500000000 },
         { destination: 'Alemania', volume: 80000, value: 600000000 },
         { destination: 'Israel', volume: 40000, value: 300000000 }
       ];
    } else if (hsCode.startsWith('28')) { // Litio/Químicos
        mockFlows = [
            { destination: 'China', volume: 40000, value: 800000000 },
            { destination: 'Estados Unidos', volume: 25000, value: 600000000 },
            { destination: 'Corea del Sur', volume: 15000, value: 350000000 }
        ];
    } else {
        // Genérico realístico
        mockFlows = [
            { destination: 'Estados Unidos', volume: 1000, value: 5000000 },
            { destination: 'Brasil', volume: 800, value: 3000000 },
            { destination: 'China', volume: 1200, value: 4500000 }
        ];
    }

    return mockFlows.map(flow => ({
        hsCode,
        originCountry,
        destinationCountry: flow.destination,
        year: 2024,
        volume: flow.volume,
        valueUsd: flow.value,
        activeCompanies: Math.floor(Math.random() * 50) + 10,
        lastUpdatedAt: timestamp,
        sourceApi: source
    }));
  }

  private static async getChedData(hsCode: string, originCountry: string) {
    return await db.select()
      .from(marketData)
      .where(and(
        like(marketData.hsCode, `${hsCode}%`),
        eq(marketData.originCountry, originCountry),
        // Podríamos agregar filtro de antigüedad aquí (ej. lastUpdatedAt > 30 days ago)
      ))
      .orderBy(desc(marketData.valueUsd));
  }

  private static async saveToDatabase(rows: any[]) {
    console.log(`💾 Ingesting ${rows.length} records into Global DB...`);
    
    // Transacción implícita (batch insert)
    for (const row of rows) {
        // Verificar si existe para actualizar o insertar
        // Por simplicidad en MVP, insertamos nuevo con ID único.
        // En prod, usaríamos upsert/onConflict
        
        await db.insert(marketData).values({
            id: randomUUID(),
            hsCode: row.hsCode,
            originCountry: row.originCountry,
            destinationCountry: row.destinationCountry,
            year: row.year,
            volume: row.volume,
            valueUsd: row.valueUsd,
            activeCompanies: row.activeCompanies,
            lastUpdatedAt: new Date(),
            sourceApi: row.sourceApi
        });
    }
    console.log('✅ Ingestion Complete.');
  }
}
