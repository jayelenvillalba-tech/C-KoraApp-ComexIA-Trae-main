import { ExternalDataService } from '../backend/services/external-data';
import { initDatabase, db } from '../database/db-sqlite';

/**
 * Script de Ingestión Masiva para che.comex v2
 * Recorre capítulos clave del sistema armonizado y "fuerza" la obtención de datos
 * desde el ExternalDataService (que consulta APIs reales/simuladas).
 */
async function ingestGlobalData() {
  console.log('🚀 Starting MASSIVE Global Data Ingestion...');
  await initDatabase();

  const priorityCodes = [
    // 🌾 Agro
    { code: '1001', name: 'Trigo' },
    { code: '1005', name: 'Maíz' },
    { code: '1201', name: 'Soja' },
    { code: '1507', name: 'Aceite de Soja' },
    { code: '2204', name: 'Vino' },
    { code: '0201', name: 'Carne Bovina (Fresca)' },
    { code: '0202', name: 'Carne Bovina (Congelada)' },
    
    // 🔋 Energía y Minería
    { code: '2709', name: 'Petróleo Crudo' },
    { code: '2711', name: 'Gas Natural (LNG)' },
    { code: '2805', name: 'Litio (Carbonato/Metal)' },
    { code: '7108', name: 'Oro' },
    { code: '7403', name: 'Cobre Refinado' },

    // 🏭 Industria
    { code: '8703', name: 'Automóviles' },
    { code: '3004', name: 'Medicamentos' },
    { code: '3102', name: 'Fertilizantes Nitrogenados' }
  ];

  console.log(`📋 Target: ${priorityCodes.length} Priority Sectors\n`);

  for (const product of priorityCodes) {
    console.log(`⏳ Processing [${product.code}] ${product.name}...`);
    try {
        const start = Date.now();
        // Simulamos origen Argentina para exportaciones, pero podríamos hacer 'World'
        const data = await ExternalDataService.getTradeFlows(product.code, 'Argentina', true);
        const duration = Date.now() - start;
        
        console.log(`   ✅ Ingested ${data.length} records in ${duration}ms.`);
    } catch (err) {
        console.error(`   ❌ Failed to ingest ${product.code}:`, err);
    }
  }

  console.log('\n✨ MASS INGESTION COMPLETE. Database populated with real-world trade flows.');
}

ingestGlobalData().then(() => process.exit(0)).catch(console.error);
