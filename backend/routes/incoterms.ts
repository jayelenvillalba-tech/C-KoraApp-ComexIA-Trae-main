import { Router } from 'express';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

export function createIncotermRouter() {
  const router = Router();

  // POST /api/incoterms/recommend
  router.post('/recommend', async (req, res) => {
    try {
      const {
        product, hsCode, origin, destination,
        sellerExperience = 'new', productType = 'packaged',
        userRole = 'exporter', language = 'es'
      } = req.body;

      if (!product || !origin || !destination) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const langMap: Record<string, string> = {
        es: 'Spanish', en: 'English', pt: 'Portuguese', zh: 'Mandarin Chinese'
      };
      const responseLanguage = langMap[language] || 'Spanish';

      const prompt = `You are an international trade expert specialized in Incoterms 2020.

A ${userRole} with ${sellerExperience} experience wants to trade:
- Product: ${product} (HS Code: ${hsCode || 'N/A'})
- Route: ${origin} → ${destination}
- Product type: ${productType}

Respond ONLY with valid JSON (no markdown, no code fences) in ${responseLanguage} language:
{
  "recommended": "FOB",
  "reasoning": "3 sentences max explaining why, in plain language for a SME owner",
  "alternatives": [
    { "incoterm": "CFR", "pros": "one sentence", "cons": "one sentence" },
    { "incoterm": "CIF", "pros": "one sentence", "cons": "one sentence" }
  ],
  "costImpact": {
    "sellerEstimation": "Brief description of seller costs",
    "buyerEstimation": "Brief description of buyer costs"
  }
}`;

      // Call Groq
      let recommendation: any;

      if (GROQ_API_KEY) {
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.3,
              max_tokens: 600,
            })
          });
          const groqData = await groqRes.json();
          const raw = groqData.choices?.[0]?.message?.content || '';
          recommendation = JSON.parse(raw.trim());
        } catch (parseErr) {
          console.warn('[incoterms] Groq parse failed, using fallback');
          recommendation = null;
        }
      }

      // Fallback if no API key or parse failed
      if (!recommendation) {
        const isMercosur = ['AR','BR','UY','PY'].includes(origin) && ['AR','BR','UY','PY'].includes(destination);
        recommendation = {
          recommended: sellerExperience === 'new' ? 'FOB' : 'CFR',
          reasoning: `Para una ${sellerExperience === 'new' ? 'PyME nueva' : 'empresa con experiencia'} exportando ${product} desde ${origin} hacia ${destination}, ${sellerExperience === 'new' ? 'FOB es la opción más segura porque el costo logístico queda del lado del comprador. Es el Incoterm más usado en Argentina y simplifica la operación.' : 'CFR permite ofrecer un precio más competitivo incluyendo el flete, lo que facilita la negociación.'} ${isMercosur ? 'La ruta MERCOSUR reduce aranceles significativamente.' : ''}`,
          alternatives: [
            { incoterm: 'CIF', pros: 'Precio llave en mano, muy demandado por importadores asiáticos', cons: 'Mayor responsabilidad y riesgo para el exportador durante el transporte' },
            { incoterm: 'EXW', pros: 'Mínima responsabilidad para el vendedor', cons: 'El comprador debe gestionar todo el transporte internacional, poco competitivo' }
          ],
          costImpact: {
            sellerEstimation: `Gastos en ${origin}: preparación, embalaje, despacho aduanero y entrega al puerto`,
            buyerEstimation: `Gastos en ${destination}: flete internacional, seguro, aranceles de importación y entrega final`
          }
        };
      }

      return res.json({ success: true, data: recommendation });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  return router;
}
