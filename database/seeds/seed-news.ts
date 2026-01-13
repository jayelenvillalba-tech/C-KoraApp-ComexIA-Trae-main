import { db } from '../db-sqlite.js';
import { news } from '../../shared/schema-sqlite.js';

async function seedNews() {
    console.log('📰 Seeding News...');
    
    // Clear existing (optional, but good for demo)
    try {
        // await db.delete(news); // Keep existing if any, or seed fresh
    } catch(e) {}
    
    const items = [
        { title: "Nueva regulación de la UE sobre deforestación entra en vigor", category: "regulacion", summary: "La EUDR exige trazabilidad completa para productos como soja, carne y madera.", source: "European Commission", url: "#", imageUrl: "https://images.unsplash.com/photo-1542601906990-24ccd08d7455" },
        { title: "China reduce aranceles para carne premium del Mercosur", category: "mercado", summary: "Acuerdo histórico reduce 5% los aranceles de entrada para cortes de alta calidad.", source: "China Daily", url: "#", imageUrl: "https://images.unsplash.com/photo-1551759650-d6c5a83405c5" },
        { title: "Puerto de Santos implementa IA para reducir tiempos de espera", category: "logistica", summary: "Nuevo sistema automatizado promete reducir congestión en un 30%.", source: "Logistics World", url: "#", imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d" },
        { title: "India busca diversificar proveedores de aceite de girasol", category: "mercado", summary: "Oportunidad para exportadores argentinos ante la volatilidad en Europa del Este.", source: "Economist Times", url: "#", imageUrl: "https://images.unsplash.com/photo-1473979738029-e15647a508ba" },
        { title: "USA actualiza requisitos fitosanitarios para cítricos", category: "regulacion", summary: "Nuevos protocolos de tratamiento en frío requeridos para la temporada 2026.", source: "USDA", url: "#", imageUrl: "https://images.unsplash.com/photo-1615485500704-8e99099928b3" },
        { title: "El Canal de Panamá restringe calado por sequía", category: "logistica", summary: "Buques de gran porte deberán reducir carga en los próximos meses.", source: "Panama Canal Authority", url: "#", imageUrl: "https://images.unsplash.com/photo-1574620027788-299f1fa208c0" }
    ];

    for (const item of items) {
        await db.insert(news).values({
            ...item,
            publishedAt: new Date()
        });
    }
    console.log('✅ News seeded');
    process.exit(0);
}

seedNews();
