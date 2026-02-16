
import { db } from '../db-sqlite';
import { news } from '../../shared/schema-sqlite';

export async function seedNews() {
  console.log('🌱 Seeding News...');

  try {
    const articles = [
      {
        id: crypto.randomUUID(),
        title: "China reduce aranceles para soja sudamericana",
        content: "El gobierno chino anunció una reducción del 2% en los aranceles de importación...",
        imageUrl: "bg-gradient-to-br from-green-500 to-emerald-700",
        source: "Global Trade Daily",
        url: "#",
        publishedAt: new Date(),
        tags: JSON.stringify(['soja', 'china', 'aranceles', '1201'])
      },
      {
        id: crypto.randomUUID(),
        title: "Sequía en Australia impulsa precios del trigo",
        content: "La menor producción esperada en Australia ha disparado los futuros de trigo...",
        imageUrl: "bg-gradient-to-br from-yellow-500 to-orange-600",
        source: "AgroMarket News",
        url: "#",
        publishedAt: new Date(),
        tags: JSON.stringify(['trigo', 'australia', 'precios', '1001'])
      },
      {
        id: crypto.randomUUID(),
        title: "Nuevo protocolo de vinos con Reino Unido",
        content: "Se simplifican los certificados de origen para vinos varietales...",
        imageUrl: "bg-gradient-to-br from-purple-600 to-pink-600",
        source: "Wines & Spirits",
        url: "#",
        publishedAt: new Date(),
        tags: JSON.stringify(['vino', 'uk', 'regulaciones', '2204'])
      },
      {
        id: crypto.randomUUID(),
        title: "Demanda récord de software en LATAM",
        content: "Las empresas tecnológicas buscan partners en la región...",
        imageUrl: "bg-gradient-to-br from-blue-500 to-cyan-500",
        source: "TechCrunch Latam",
        url: "#",
        publishedAt: new Date(),
        tags: JSON.stringify(['software', 'servicios', '8523'])
      }
    ];

    for (const article of articles) {
      await db.insert(news).values(article);
    }

    console.log('✅ News Seeded!');
  } catch (error) {
    console.error('❌ Error seeding news:', error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedNews()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
