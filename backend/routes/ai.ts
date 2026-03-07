import { Router, Request, Response } from "express";

const router = Router();

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
- **MERCOSUR**: Argentina, Brasil, Uruguay, Paraguay, Venezuela (suspendida). Arancel Intrazona: 0% la mayoría de productos. TEC (Arancel Externo Común).
- **ACE-35** (Argentina-Chile): Libre comercio casi total. Zona de libre comercio desde 1996.
- **ACE-18** (MERCOSUR-Chile ampliado)
- **ACE-58** (MERCOSUR-Perú): Desgravación progresiva, mayoría 0%.
- **ACE-59** (MERCOSUR-Colombia, Ecuador, Venezuela)
- **ACE-36** (Argentina-Bolivia): Acceso preferencial.
- **ACE-6** (Argentina-México): Preferencias arancelarias en sectores específicos.
- **ACE-14** (Argentina-Brasil): Base del MERCOSUR.
- **ALADI**: Acuerdos de alcance parcial con Cuba, México, etc.
- **SGP** (Sistema Generalizado de Preferencias): USA, UE, Japón, Canadá ofrecen preferencias a Argentina.
- **MERCOSUR-UE**: Acuerdo firmado 2019, en proceso de ratificación (2024-2025). Reducirá aranceles hasta 0% en 10-15 años.
- **MERCOSUR-EFTA** (Suiza, Noruega, Islandia, Liechtenstein): Negociaciones avanzadas.
- **MERCOSUR-Singapur**: Acuerdo en negociación.
- **MERCOSUR-Vietnam**: Negociaciones en curso.
- **OMC/GATT**: Argentina miembro, aplica cláusula NMF.

## CÓDIGOS HS Y NOMENCLATURA
- Sistema Armonizado (SA) 2022 - versión OMA
- NCM (Nomenclatura Común del MERCOSUR) - 8 dígitos
- NALADISA - nomenclatura ALADI
- Cómo clasificar mercaderías, reglas generales de interpretación
- Posiciones arancelarias: capítulos 01 al 97
- Derechos de exportación (retenciones): soja 33%, trigo/maíz variables, economías regionales 0-5%

## DOCUMENTACIÓN DE EXPORTACIÓN
- Permiso de Embarque (PE) - AFIP/ARCA
- Declaración Aduanera de Exportación (DAE/SIM)
- Factura Comercial (Commercial Invoice) - requisitos internacionales
- Packing List (Lista de Empaque)
- Certificado de Origen: MERCOSUR, preferencial, no preferencial
- Bill of Lading (B/L) - Conocimiento de Embarque
- Airway Bill (AWB) - Guía Aérea
- Carta de Porte (para cargas terrestres)
- Certificado Fitosanitario (SENASA)
- Certificado Zoosanitario (SENASA)
- Certificado de Calidad (IRAM, INTI)
- Certificado de Libre Venta
- EUR.1 para exportaciones a la UE (cuando aplique GSP)
- Form A (SGP - Sistema Generalizado de Preferencias)
- Certificado de Fumigación
- Póliza de Seguro internacional (CIF vs FOB)

## INCOTERMS 2020
- EXW, FCA, CPT, CIP, DAP, DPU, DDP (cualquier modo)
- FOB, CFR, CIF (marítimo/fluvial)
- Cuándo usar cada uno, responsabilidades, transferencia de riesgo

## LOGÍSTICA INTERNACIONAL
- Puertos argentinos: Buenos Aires, Rosario, Bahía Blanca, Mar del Plata, Ushuaia
- Aeroparque y Ezeiza para carga aérea
- Pasos fronterizos terrestres: Mendoza (Paso Los Libertadores), Jujuy, Misiones
- Agentes de carga (freight forwarders)
- Cálculo de costos logísticos: flete, seguro, THC, handling
- Contenedores: 20', 40', 40'HC, refrigerados (reefer)
- Courier internacional: DHL, FedEx, UPS - para muestras y envíos pequeños

## FINANCIAMIENTO Y DIVISAS
- Financiamiento de exportaciones: Forfaiting, factoring internacional
- Carta de Crédito (L/C) - cómo funciona, tipos
- Cobranza documentaria
- SEPYME - líneas de crédito para exportadores PyME
- BICE - Banco de Inversión y Comercio Exterior
- Seguro de crédito a la exportación (CASCE/BICE)
- Normas BCRA para liquidación de divisas (plazos, excepciones)
- Tipo de cambio exportador, dólar blend, MEP

## ORGANISMOS CLAVE
- AFIP/ARCA: registro exportadores, despachos aduaneros
- SENASA: certificados sanitarios y fitosanitarios
- CANCILLERÍA: certificados de origen no preferenciales
- CAMARA DE COMERCIO: certificados de origen MERCOSUR
- ARGENTRADE / ProArgentina: promoción de exportaciones
- BANCO NACIÓN: financiamiento exportaciones
- ADUANA: procedimientos, valoración aduanera, ATA Carnet

## SECTORES PRODUCTIVOS ARGENTINOS
- Agroindustria: soja, maíz, trigo, girasol, carne vacuna, porcina, avícola, lácteos, vinos, frutas
- Economías Regionales: limones (Tucumán), arándanos, aceite de oliva, maní, yerba mate
- Manufactura: autopartes, maquinaria agrícola, química, farmacéutica
- Servicios: software (Ley 27.506), diseño, consultoría
- Minería: litio, oro, plata, cobre

## CÓMO RESPONDÉS
- Siempre mencionás normativa específica con número de ley/resolución cuando aplica
- Das pasos concretos y accionables
- Cuando no sabés algo reciente, lo aclarás y sugerís consultar fuente oficial
- Podés hacer cálculos simples de aranceles, costos logísticos, márgenes
- Respondés preguntas sobre países específicos (su sistema arancelario, documentos requeridos)
- Nunca inventás información — si hay duda, lo decís claramente
- Sos conciso pero completo. Usás listas cuando ayuda a la claridad.`;

// ─── POST /api/ai/chat — Chat principal ───────────────────────────────────────
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Se requiere un array de mensajes" });
    }

    // Enriquecer el system prompt con el contexto actual de la página
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

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        system: systemPrompt,
        messages: messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return res.status(502).json({
        error: "Error al conectar con la IA",
        detail: errText,
      });
    }

    const data = await response.json() as any;
    const reply = data.content?.[0]?.text || "No pude generar una respuesta.";

    res.json({
      role: "assistant",
      content: reply,
      model: "claude-sonnet-4",
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Error interno del servidor", detail: error.message });
  }
});

// ─── GET /api/ai/search — Búsqueda de Códigos HS ─────────────────────────────
router.get("/search", async (req: Request, res: Response) => {
  const { q, country = "AR", operation = "export" } = req.query;

  if (!q || String(q).length < 2) {
    return res.json({ results: [] });
  }

  const hsDatabase = [
    { code: "1001.99.00", description: "Trigo", product: "Trigo blando y escanda", chapter: "10", unit: "kg", notes: "Principal cereal de exportación argentina. Retención 0% (variable por resolución MEP)." },
    { code: "1001.19.00", description: "Trigo duro", product: "Trigo duro (candeal)", chapter: "10", unit: "kg", notes: "Para pasta y semolín. Exportación libre." },
    { code: "1005.90.10", description: "Maíz", product: "Maíz amarillo para uso forrajero", chapter: "10", unit: "kg", notes: "Segundo cereal exportable. Retención variable." },
    { code: "1201.90.00", description: "Soja", product: "Habas de soja, incluso quebrantadas", chapter: "12", unit: "kg", notes: "Principal exportación argentina. Retención 33%." },
    { code: "1507.10.00", description: "Aceite de soja", product: "Aceite de soja en bruto", chapter: "15", unit: "kg", notes: "Complejo sojero. ROE requerido." },
    { code: "2304.00.10", description: "Harina de soja", product: "Tortas y harina de soja (pellets)", chapter: "23", unit: "kg", notes: "Pellets de soja, alta demanda China." },
    { code: "0201.10.00", description: "Carne bovina", product: "Carne bovina fresca en canales y medias canales", chapter: "02", unit: "kg", notes: "Con hueso. Cuota Hilton para UE." },
    { code: "0201.20.00", description: "Carne bovina", product: "Carne bovina deshuesada fresca o refrigerada", chapter: "02", unit: "kg", notes: "Sin hueso. Alta demanda China y UE." },
    { code: "0202.30.00", description: "Carne bovina congelada", product: "Carne bovina deshuesada congelada", chapter: "02", unit: "kg", notes: "Principal destino: China. Cuota 481 USA." },
    { code: "1006.30.21", description: "Arroz", product: "Arroz blanqueado de grano largo fino", chapter: "10", unit: "kg", notes: "Exportación a Brasil, Chile, Irak." },
    { code: "0901.11.00", description: "Café", product: "Café sin tostar, sin descafeinar", chapter: "09", unit: "kg", notes: "Importación principalmente (no producción local)." },
    { code: "8517.12.00", description: "Smartphones / Celulares", product: "Teléfonos inteligentes (smartphones)", chapter: "85", unit: "u", notes: "Tierra del Fuego - régimen especial. Importación con SIRA." },
    { code: "0402.10.10", description: "Leche en polvo", product: "Leche en polvo descremada < 1,5% grasa", chapter: "04", unit: "kg", notes: "Exportación a Brasil, Algeria, Venezuela." },
    { code: "2204.21.20", description: "Vino", product: "Vino de uvas frescas embotellado ≤ 2 litros", chapter: "22", unit: "l", notes: "Mendoza, San Juan. Retención 0%. Alta demanda USA, UK, Brasil." },
    { code: "0805.10.00", description: "Naranjas", product: "Naranjas frescas o secas", chapter: "08", unit: "kg", notes: "Entre Ríos, Corrientes. Certificado SENASA." },
    { code: "0810.40.00", description: "Arándanos", product: "Arándanos (blueberries) frescos", chapter: "08", unit: "kg", notes: "Tucumán, Buenos Aires. Alta demanda USA, Europa." },
    { code: "2401.10.10", description: "Tabaco", product: "Tabaco rubio sin desvenar o sin desnervar", chapter: "24", unit: "kg", notes: "Jujuy, Salta, Misiones. FET aplicable." },
    { code: "7108.12.10", description: "Oro", product: "Oro en bruto para uso no monetario (pepitas)", chapter: "71", unit: "g", notes: "San Juan, Santa Cruz. Régimen minero especial." },
    { code: "2709.00.10", description: "Petróleo crudo", product: "Aceites crudos de petróleo o mineral bituminoso", chapter: "27", unit: "kg", notes: "Neuquén (Vaca Muerta). Retenciones variables." },
    { code: "4101.20.10", description: "Cuero bovino", product: "Cueros bovinos enteros frescos o salados", chapter: "41", unit: "kg", notes: "Frigoríficos. Retención 5%." },
    { code: "1701.14.00", description: "Azúcar de caña", product: "Azúcar de caña en bruto sin aromatizar", chapter: "17", unit: "kg", notes: "Tucumán, Jujuy, Salta. ROE azúcar." },
    { code: "0303.89.00", description: "Pescado congelado", product: "Pescado congelado (merluza, calamar)", chapter: "03", unit: "kg", notes: "Patagonia. Alta demanda España, Italia, Brasil." },
    { code: "8471.30.00", description: "Laptops / Computadoras portátiles", product: "Máquinas automáticas para tratamiento de datos portátiles", chapter: "84", unit: "u", notes: "Importación con SIRA. Tierra del Fuego para ensamblado." },
    { code: "3004.90.69", description: "Medicamentos", product: "Medicamentos para uso humano (otros)", chapter: "30", unit: "kg", notes: "ANMAT aprobación requerida para importación/exportación." },
    { code: "1512.11.10", description: "Aceite de girasol", product: "Aceite de girasol en bruto", chapter: "15", unit: "kg", notes: "Buenos Aires, Santa Fe. Alta demanda India, Países Bajos." },
    { code: "1208.10.00", description: "Harina de soja", product: "Harina de semillas de soja desgrasada", chapter: "12", unit: "kg", notes: "Retención 31%. Exportación a UE, Indonesia." },
    { code: "2833.25.00", description: "Litio / Sulfato de litio", product: "Sulfato de litio", chapter: "28", unit: "kg", notes: "Jujuy, Salta. Litio triángulo. Alta demanda Asia." },
    { code: "2825.20.00", description: "Carbonato de litio", product: "Carbonato de litio", chapter: "28", unit: "kg", notes: "Exportación carbonato grado batería. Tesla, CATL demandan." },
    { code: "0207.14.00", description: "Pollo / Carne aviar", product: "Trozos y despojos de gallo/gallina congelados", chapter: "02", unit: "kg", notes: "Brasil competidor. Exportación a China, Hong Kong, Chile." },
    { code: "2207.10.00", description: "Bioetanol / Alcohol etílico", product: "Alcohol etílico sin desnaturalizar ≥ 80% vol", chapter: "22", unit: "l", notes: "Córdoba, Santa Fe. Exportación a USA, India." },
    { code: "1005.10.90", description: "Maíz para siembra", product: "Maíz para siembra (semillas certificadas)", chapter: "10", unit: "kg", notes: "Exportación semillas. INASE certificación." },
    { code: "8708.99.90", description: "Autopartes", product: "Partes y accesorios de vehículos automóviles", chapter: "87", unit: "u", notes: "Córdoba, Buenos Aires. Comercio intraindustrial con Brasil." },
    { code: "8432.80.00", description: "Maquinaria agrícola", product: "Máquinas y aparatos para agricultura (otros)", chapter: "84", unit: "u", notes: "Rosario, Córdoba. Exportación a Brasil, Bolivia, África." },
    { code: "2204.10.00", description: "Champagne / Espumante", product: "Vinos espumosos (champagne, cava, prosecco)", chapter: "22", unit: "l", notes: "Mendoza. Retención 0%. Exportación creciente." },
    { code: "0811.20.00", description: "Frambuesas congeladas", product: "Frambuesas, zarzamoras congeladas sin azúcar", chapter: "08", unit: "kg", notes: "Patagonia. Certificado SENASA para UE." },
    { code: "7601.10.00", description: "Aluminio", product: "Aluminio en bruto sin alear", chapter: "76", unit: "kg", notes: "ALUAR Puerto Madryn. Exportación global." },
    { code: "2614.00.10", description: "Titanio", product: "Minerales de titanio y sus concentrados", chapter: "26", unit: "kg", notes: "Río Negro. Exportación en bruto." },
    { code: "4802.55.90", description: "Papel", product: "Papel para impresión o escritura en rollos", chapter: "48", unit: "kg", notes: "Misiones. Exportación a Latinoamérica." },
    { code: "6302.21.00", description: "Ropa de cama", product: "Ropa de cama de algodón estampada", chapter: "63", unit: "u", notes: "PyME textil. Importación desde China frecuente." },
    { code: "6403.99.00", description: "Calzado", product: "Calzado de cuero con suela de cuero", chapter: "64", unit: "par", notes: "Buenos Aires. Marca de origen importante." },
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

  await new Promise((resolve) => setTimeout(resolve, 150));

  res.json({
    query: q,
    country,
    operation,
    results,
    total: results.length,
    source: "checomex-db",
  });
});

// ─── POST /api/ai/analyze — Análisis rápido de un producto ───────────────────
router.post("/analyze", async (req: Request, res: Response) => {
  try {
    const { hsCode, product, country = "AR", operation = "export", targetCountry } = req.body;

    const prompt = `Analizá brevemente la ${operation === "export" ? "exportación" : "importación"} del producto "${product}" (HS: ${hsCode}) ${operation === "export" ? "desde" : "hacia"} Argentina${targetCountry ? ` hacia ${targetCountry}` : ""}.

Incluí:
1. Arancel aplicable y tratado/acuerdo relevante
2. 2-3 documentos clave requeridos
3. Un dato de mercado relevante
4. Una oportunidad o riesgo principal

Sé conciso (máx 250 palabras).`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 600,
        system: COMEX_SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json() as any;
    const analysis = data.content?.[0]?.text || "No pude generar el análisis.";

    res.json({ hsCode, product, country, operation, analysis });
  } catch (error: any) {
    res.status(500).json({ error: "Error al analizar", detail: error.message });
  }
});

export default router;
