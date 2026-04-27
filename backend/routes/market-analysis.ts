import express from 'express';

import { handleCountryRecommendations } from './country-recommendations';

const router = express.Router();

// 1. Endpoint para /api/market-analysis/recommendations
// Map legacy endpoint to the new Opportunity Engine handler
router.get('/recommendations', handleCountryRecommendations);

// 2. Endpoint General /api/market-analysis
// Provee historicalData y relevantNews
router.get('/', (req, res) => {
  const hsCode = req.query.hsCode as string || '';
  const isMeat = hsCode.startsWith('02');
  
  let relevantNews = [
    {
      title: 'Global Trade Update: Nuevas métricas aduaneras',
      image: 'bg-gradient-to-br from-blue-500 to-purple-600',
      source: 'Comex News',
      date: new Date().toISOString()
    }
  ];

  if (isMeat) {
    relevantNews = [
      {
        title: 'Aumento de la demanda de carne bovina en el mercado asiático post-pandemia',
        image: 'bg-gradient-to-br from-orange-500 to-red-600',
        source: 'Reuters',
        date: new Date().toISOString()
      },
      {
        title: 'Nuevas regulaciones de bienestar animal impactan importaciones en la Unión Europea',
        image: 'bg-gradient-to-br from-blue-500 to-green-600',
        source: 'WTO',
        date: new Date(Date.now() - 86400000).toISOString()
      }
    ];
  }

  let historicalData = [];
  if (isMeat) {
    historicalData = [
      { year: 2020, value: 240, volume: 800 },
      { year: 2021, value: 260, volume: 830 },
      { year: 2022, value: 310, volume: 910 },
      { year: 2023, value: 295, volume: 890 },
      { year: 2024, value: 350, volume: 1050 }
    ];
  } else if (hsCode.startsWith('10')) {
    historicalData = [
      { year: 2020, value: 850, volume: 4500 },
      { year: 2021, value: 920, volume: 4800 },
      { year: 2022, value: 1150, volume: 5200 },
      { year: 2023, value: 1080, volume: 5100 },
      { year: 2024, value: 1250, volume: 5800 }
    ];
  } else {
    historicalData = [
      { year: 2020, value: 120, volume: 450 },
      { year: 2021, value: 135, volume: 480 },
      { year: 2022, value: 150, volume: 520 },
      { year: 2023, value: 142, volume: 510 },
      { year: 2024, value: 165, volume: 600 }
    ];
  }

  res.json({
    success: true,
    analysis: {
      relevantNews,
      historicalData,
      marketSize: 1500000,
      growthRate: 8,
      marketStatus: 'growing'
    }
  });
});

export default router;
