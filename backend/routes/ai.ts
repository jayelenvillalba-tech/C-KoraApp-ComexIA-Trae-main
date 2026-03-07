import { Router, Request, Response } from "express";

const router = Router();

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// ─── System Prompt especializado en Comercio Exterior Argentino ───────────────
const COMEX_SYSTEM_PROMPT = `Sos el asistente de IA de Che.Comex AI, la plataforma de comercio internacional para PyMEs argentinas.
Tu nombre es "Che.Comex AI". Respondés en español rioplatense (vos, che, etc.) de forma clara, directa y profesional.
Sos experto en:

## NORMATIVA Y LEYES ARGENTINA
- Ley 24.425 (Código Aduanero Argentino - CAA) y sus modificaciones
- Código Aduanero (Ley 22.415) - procedimientos de exportación e importación
- Resoluciones AFIP/ARCA: RG 2000, RG 3252, RG 3450, RG 4338, RG 5366 y actualizaciones
- SIRA (Sistema de Importaciones de la República Argentina) y SIRASE
- SEDI (Sistema de Exportaciones de la República Argentina)
- ROE (Registros de Operaciones de Exportación) para granos y oleaginosas
- Declaración Jurada de Ventas al Exterior (DJVE)
- Régimen de Factura E para exportaciones
- Percepciones y retenciones impositivas en operaciones de comercio exterior
- Ley Pyme 25.300 y beneficios para exportadores PyME
- Régimen de Admisión Temporaria (Decreto 1330/04)
- Drawback y reintegros a la exportación
- Normas BCRA sobre ingreso de divisas (Com. A 6770, A 7030 y actualizaciones)

## TRATADOS INTERNACIONALES VIGENTES
- MERCOSUR: Argentina, Brasil, Uruguay, Paraguay. Arancel Intrazona 0% mayoría productos. TEC.
- ACE-35 (Argentina-Chile): Libre comercio casi total desde 1996.
- ACE-18 (MERCOSUR-Chile ampliado)
- ACE-58 (MERCOSUR-Perú): Desgravación progresiva, mayoría 0%.
- ACE-59 (MERCOSUR-Colombia, Ecuador, Venezuela)
- ACE-36 (Argentina-Bolivia): Acceso preferencial.
- ACE-6 (Argentina-México): Preferencias arancelarias en sectores específicos.
- ACE-14 (Argentina-Brasil): Base del MERCOSUR.
- ALADI: Acuerdos de alcance parcial con Cuba, México, etc.
- SGP: USA, UE, Japón, Canadá ofrecen preferencias a Argentina.
- MERCOSUR-UE: Acuerdo firmado 2019, en ratificación. Reducirá aranceles 0% en 10-15 años.
- MERCOSUR-EFTA (Suiza, Noruega, Islandia, Liechtenstein): Negociaciones avanzadas.
- OMC/GATT: Argentina miembro, aplica cláusula NMF.

## CÓDIGOS HS Y NOMENCLATURA
- Sistema Armonizado (SA) 2022 - versión OMA
- NCM (Nomenclatura Común del MERCOSUR) - 8 dígitos
- Reglas generales de interpretación del SA
- Derechos de exportación: soja 33%, trigo/maíz variables, economías regionales 0-5%

## DOCUMENTACIÓN DE EXPORTACIÓN
- Permiso de Embarque (PE) - AFIP/ARCA
- Declaración Aduanera de Exportación (DAE/SIM)
- Factura Comercial, Packing List
- Certificado de Origen: MERCOSUR, preferencial, no preferencial
- Bill of Lading (B/L), Airway Bill (AWB), Carta de Porte
- Certificado Fitosanitario y Zoosanitario (SENASA)
- EUR.1 para exportaciones a la UE (GSP), Form A (SGP)

## INCOTERMS 2020
- EXW, FCA, CPT, CIP, DAP, DPU, DDP, FOB, CFR, CIF
- Cuándo usar cada uno, responsabilidades, transferencia de riesgo

## LOGÍSTICA INTERNACIONAL
- Puertos: Buenos Aires, Rosario, Bahía Blanca, Mar del Plata, Ushuaia
- Pasos fronterizos: Mendoza (Los Libertadores), Jujuy, Misiones
- Contenedores: 20', 40', 40'HC, reefer
- Cálculo FOB, CIF, costos logísticos

## FINANCIAMIENTO
- Carta de Crédito (L/C), Cobranza documentaria
- SEPYME, BICE - líneas crédito exportadores PyME
- Normas BCRA liquidación divisas, tipo de cambio exportador

## CÓMO RESPONDÉS
- Siempre mencionás normativa específica con número cuando aplica
- Das pasos concretos y accionables
- Podés hacer cálculos simples de aranceles y costos
- Respondés sobre cualquier país (su sistema arancelario, documentos)
- Nunca inventás info — si hay duda, lo aclarás
- Sos conciso pero completo. Usás listas cuando ayuda.`;

// ─── Helper: llamar a Groq API ────────────────────────────────────────────────
async function callGroq(messages: any[], systemPrompt: string, maxTokens = 1200) {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }

  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content || "No pude generar una respuesta.";
}

// ─── POST /api/ai/chat — Chat principal ───────────────────────────────────────
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Se requiere un array de mensajes" });
    }

    let systemPrompt = COMEX_SYSTEM_PROMPT;
    if (context) {
      systemPrompt += `\n\n## CONTEXTO ACTUAL DEL USUARIO
El usuario está analizando:
- Producto: ${context.product || "No especificado"}
- Código HS: ${context.hsCode || "No especificado"}
- País de origen: ${context.country || "Argentina"}
- Operación: ${context.operation || "exportación"}
Usá este contexto para dar respuestas más precisas y relevantes.`;
    }

    const reply = await callGroq(messages, systemPrompt);

    res.json({
      role: "assistant",
      content: reply,
      model: "llama-3.3-70b-versatile",
    });
  } catch (error: any) {
    console.error("Chat error:", error.message);
    res.status(500).json({
      error: "Error al conectar con la IA",
      detail: error.message,
    });
  }
});

// ─── GET /api/ai/search — Búsqueda de Códigos HS ─────────────────────────────
router.get("/search", async (req: Request, res: Response) => {
  const { q, country = "AR", operation = "export" } = req.query;

  if (!q || String(q).length < 2) {
    return res.json({ results: [] });
  }

  const hsDatabase = [
    { code: "1001.99.00", description: "Trigo", product: "Trigo blando y escanda", chapter: "10", unit: "kg", notes: "Principal cereal exportación AR. Retención variable MEP." },
    { code: "1001.19.00", description: "Trigo duro", product: "Trigo duro (candeal)", chapter: "10", unit: "kg", notes: "Para pasta y semolín." },
    { code: "1005.90.10", description: "Maíz", product: "Maíz amarillo forrajero", chapter: "10", unit: "kg", notes: "2do cereal exportable AR. Retención variable." },
    { code: "1201.90.00", description: "Soja", product: "Habas de soja", chapter: "12", unit: "kg", notes: "Principal exportación AR. Retención 33%." },
    { code: "1507.10.00", description: "Aceite de soja", product: "Aceite de soja en bruto", chapter: "15", unit: "kg", notes: "Complejo sojero. ROE requerido." },
    { code: "2304.00.10", description: "Pellets de soja", product: "Tortas y harina de soja (pellets)", chapter: "23", unit: "kg", notes: "Alta demanda China y UE." },
    { code: "0201.10.00", description: "Carne bovina", product: "Carne bovina fresca en canales", chapter: "02", unit: "kg", notes: "Con hueso. Cuota Hilton para UE." },
    { code: "0201.20.00", description: "Carne bovina deshuesada", product: "Carne bovina deshuesada fresca", chapter: "02", unit: "kg", notes: "Alta demanda China y UE." },
    { code: "0202.30.00", description: "Carne bovina congelada", product: "Carne bovina deshuesada congelada", chapter: "02", unit: "kg", notes: "Principal destino: China." },
    { code: "1006.30.21", description: "Arroz", product: "Arroz blanqueado grano largo", chapter: "10", unit: "kg", notes: "Exportación a Brasil, Chile, Irak." },
    { code: "8517.12.00", description: "Smartphones / Celulares", product: "Teléfonos inteligentes", chapter: "85", unit: "u", notes: "Tierra del Fuego régimen especial." },
    { code: "0402.10.10", description: "Leche en polvo", product: "Leche en polvo descremada", chapter: "04", unit: "kg", notes: "Exportación a Brasil, Algeria." },
    { code: "2204.21.20", description: "Vino", product: "Vino embotellado ≤2L", chapter: "22", unit: "l", notes: "Mendoza, San Juan. Retención 0%." },
    { code: "0805.10.00", description: "Naranjas", product: "Naranjas frescas o secas", chapter: "08", unit: "kg", notes: "Entre Ríos, Corrientes. Cert. SENASA." },
    { code: "0810.40.00", description: "Arándanos", product: "Arándanos frescos", chapter: "08", unit: "kg", notes: "Tucumán, Buenos Aires. Alta demanda USA/Europa." },
    { code: "2401.10.10", description: "Tabaco", product: "Tabaco rubio sin desvenar", chapter: "24", unit: "kg", notes: "Jujuy, Salta, Misiones." },
    { code: "7108.12.10", description: "Oro", product: "Oro en bruto no monetario", chapter: "71", unit: "g", notes: "San Juan, Santa Cruz. Régimen minero." },
    { code: "2709.00.10", description: "Petróleo crudo", product: "Aceites crudos de petróleo", chapter: "27", unit: "kg", notes: "Neuquén (Vaca Muerta)." },
    { code: "4101.20.10", description: "Cuero bovino", product: "Cueros bovinos enteros frescos", chapter: "41", unit: "kg", notes: "Retención 5%." },
    { code: "1701.14.00", description: "Azúcar de caña", product: "Azúcar de caña en bruto", chapter: "17", unit: "kg", notes: "Tucumán, Jujuy, Salta." },
    { code: "0303.89.00", description: "Pescado congelado", product: "Merluza, calamar congelado", chapter: "03", unit: "kg", notes: "Patagonia. Alta demanda España, Italia." },
    { code: "8471.30.00", description: "Laptops / Computadoras", product: "Computadoras portátiles", chapter: "84", unit: "u", notes: "Importación con SIRA." },
    { code: "3004.90.69", description: "Medicamentos", product: "Medicamentos uso humano", chapter: "30", unit: "kg", notes: "Aprobación ANMAT requerida." },
    { code: "1512.11.10", description: "Aceite de girasol", product: "Aceite de girasol en bruto", chapter: "15", unit: "kg", notes: "Alta demanda India, Países Bajos." },
    { code: "2833.25.00", description: "Sulfato de litio", product: "Sulfato de litio", chapter: "28", unit: "kg", notes: "Jujuy, Salta. Triángulo del litio." },
    { code: "2825.20.00", description: "Carbonato de litio", product: "Carbonato de litio grado batería", chapter: "28", unit: "kg", notes: "Alta demanda Tesla, CATL." },
    { code: "0207.14.00", description: "Pollo / Carne aviar", product: "Trozos de pollo congelados", chapter: "02", unit: "kg", notes: "Exportación a China, Hong Kong, Chile." },
    { code: "8708.99.90", description: "Autopartes", product: "Partes de vehículos automóviles", chapter: "87", unit: "u", notes: "Córdoba. Comercio con Brasil." },
    { code: "8432.80.00", description: "Maquinaria agrícola", product: "Máquinas para agricultura", chapter: "84", unit: "u", notes: "Rosario, Córdoba. Exportación a Brasil, Bolivia." },
    { code: "2204.10.00", description: "Vino espumante / Champagne", product: "Vinos espumosos", chapter: "22", unit: "l", notes: "Mendoza. Retención 0%." },
    { code: "7601.10.00", description: "Aluminio", product: "Aluminio en bruto sin alear", chapter: "76", unit: "kg", notes: "ALUAR Puerto Madryn." },
    { code: "1005.10.90", description: "Semillas de maíz", product: "Maíz para siembra certificado", chapter: "10", unit: "kg", notes: "INASE certificación." },
    { code: "2207.10.00", description: "Bioetanol / Alcohol etílico", product: "Alcohol etílico sin desnaturalizar", chapter: "22", unit: "l", notes: "Córdoba, Santa Fe." },
    { code: "6403.99.00", description: "Calzado de cuero", product: "Calzado cuero con suela cuero", chapter: "64", unit: "par", notes: "Buenos Aires. Marca origen importante." },
    { code: "1208.10.00", description: "Harina de soja desgrasada", product: "Harina semillas soja desgrasada", chapter: "12", unit: "kg", notes: "Retención 31%. Exportación UE, Indonesia." },
    { code: "0811.20.00", description: "Frambuesas congeladas", product: "Frambuesas y zarzamoras congeladas", chapter: "08", unit: "kg", notes: "Patagonia. Cert. SENASA para UE." },
    { code: "2614.00.10", description: "Mineral de titanio", product: "Minerales de titanio y concentrados", chapter: "26", unit: "kg", notes: "Río Negro." },
    { code: "4802.55.90", description: "Papel para impresión", product: "Papel impresión en rollos", chapter: "48", unit: "kg", notes: "Misiones. Exportación Latinoamérica." },
  ];

  const query = String(q).toLowerCase().trim();
  const results = hsDatabase
    .filter(
      (item) =>
        item.description.toLowerCase().includes(query) ||
        item.product.toLowerCase().includes(query) ||
        item.code.includes(query) ||
        item.notes.toLowerCase().includes(query)
    )
    .slice(0, 8);

  res.json({
    query: q,
    country,
    operation,
    results,
    total: results.length,
    source: "checomex-db",
  });
});

// ─── POST /api/ai/analyze — Análisis rápido de producto ──────────────────────
router.post("/analyze", async (req: Request, res: Response) => {
  try {
    const { hsCode, product, country = "AR", operation = "export", targetCountry } = req.body;

    const prompt = `Analizá brevemente la ${operation === "export" ? "exportación" : "importación"} del producto "${product}" (HS: ${hsCode}) ${operation === "export" ? "desde" : "hacia"} Argentina${targetCountry ? ` hacia ${targetCountry}` : ""}.

Incluí:
1. Arancel aplicable y tratado/acuerdo relevante
2. 2-3 documentos clave requeridos
3. Un dato de mercado relevante
4. Una oportunidad o riesgo principal

Sé conciso (máx 200 palabras).`;

    const analysis = await callGroq(
      [{ role: "user", content: prompt }],
      COMEX_SYSTEM_PROMPT,
      600
    );

    res.json({ hsCode, product, country, operation, analysis });
  } catch (error: any) {
    res.status(500).json({ error: "Error al analizar", detail: error.message });
  }
});

export default router;
