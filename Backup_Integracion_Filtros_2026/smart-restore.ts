
import Database from 'better-sqlite3';

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const TARGET_DB = 'comexia_v2.db';
const SOURCE_DB = 'backups/backup-2026-01-22/database/comexia_v2.db';

console.log(`🚀 Iniciando Migración Inteligente de Documentos`);
console.log(`   Fuente: ${SOURCE_DB}`);
console.log(`   Destino: ${TARGET_DB}`);

try {
  const source = new Database(SOURCE_DB, { readonly: true });
  const target = new Database(TARGET_DB);

  // 1. Fetch Source Data
  const sourceRows = source.prepare('SELECT * FROM country_requirements').all();
  console.log(`✅ Contenidos en backup: ${sourceRows.length} registros (agrupados por HS Code)`);

  const insert = target.prepare(`
    INSERT INTO regulatory_rules (
        id, country_code, hs_chapter, document_name, issuer, description, requirements, priority, created_at
    ) VALUES (
        @id, @countryCode, @hsChapter, @documentName, @issuer, @description, @requirements, @priority, @createdAt
    )
  `);

  const insertTransaction = target.transaction((rows) => {
    let count = 0;
    for (const row of rows) {
        // Parse JSON fields
        let docs = [];
        try { docs = JSON.parse(row.required_documents || '[]'); } catch(e) {}
        
        let phyto = [];
        try { phyto = JSON.parse(row.phytosanitary_reqs || '[]'); } catch(e) {}

        // Combine all requirements
        const allReqs = [...docs, ...phyto];

        for (const req of allReqs) {
            // Determine category/issuer based on content keywords
            let issuer = "Autoridad Aduanera";
            let type = "Documentacion";
            
            if (req.toLowerCase().includes('sanitario') || req.toLowerCase().includes('fito')) {
                issuer = "SENASA/Autoridad Sanitaria";
                type = "Sanitario";
            } else if (req.toLowerCase().includes('origen')) {
                issuer = "Cámara de Comercio";
                type = "Origen";
            } else {
                // If it's a simple string, treat as doc name
            }

            try {
                const hsChapter = (row.hs_code && typeof row.hs_code === 'string') 
                    ? row.hs_code.substring(0, 2) 
                    : '00';

                insert.run({
                    id: generateId(),
                    countryCode: row.country_code || 'XX',
                    hsChapter: hsChapter,
                    documentName: req,
                    issuer: issuer,
                    description: `Requisito ${type} para importación (Restaurado)`,
                    requirements: req,
                    priority: 1,
                    createdAt: Date.now()
                });
                count++;
            } catch (err: any) {
                console.log(`⚠️ Error insertando req: ${err.message}`);
            }
        }
    }
    return count;
  });

  const importedCount = insertTransaction(sourceRows);
  console.log(`🎉 Migración Completada: ${importedCount} documentos individuales generados.`);

  source.close();
  target.close();

} catch (error: any) {
  console.error(`❌ Error de Migración: ${error.message}`);
}
