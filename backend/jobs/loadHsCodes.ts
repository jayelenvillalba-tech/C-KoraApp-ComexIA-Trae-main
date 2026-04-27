/**
 * loadHsCodes.ts — Phase 29A
 * Three-layer strategy:
 *  Layer 1: Download HS 2022 complete dataset from GitHub (5387 codes, 6-digit)
 *  Layer 2: Load the 120+ embedded NCM codes (always runs, INSERT OR IGNORE)
 *  Layer 3: AI classifier fallback in ai-hs-classifier.ts uses local DB first
 */
import { getSqliteDb } from '../../database/db-sqlite.js';

// ─── EMBEDDED DATASET — 120+ critical NCM codes for AR/BR/Global commerce ──────
const EMBEDDED_HS_CODES = [
  // ── Chapter 01 — Live animals
  { code: '01011000', es: 'Caballos reproductores de raza pura', en: 'Pure-bred breeding horses' },
  { code: '01029010', es: 'Bovinos para reproducción de raza pura', en: 'Pure-bred breeding cattle' },
  { code: '01029090', es: 'Los demás bovinos vivos', en: 'Other live bovine animals' },
  // ── Chapter 02 — Meat
  { code: '02011000', es: 'Carcasas y medias carcasas bovinas, fresca o refrigerada', en: 'Bovine carcases, fresh or chilled' },
  { code: '02012000', es: 'Trozos sin deshuesar de bovino, fresca o refrigerada', en: 'Bovine cuts bone in, fresh or chilled' },
  { code: '02013000', es: 'Carne bovina deshuesada, fresca o refrigerada', en: 'Boneless bovine meat, fresh or chilled' },
  { code: '02021000', es: 'Carcasas y medias carcasas bovinas, congeladas', en: 'Bovine carcases, frozen' },
  { code: '02023000', es: 'Carne bovina deshuesada, congelada', en: 'Boneless bovine meat, frozen' },
  { code: '02031100', es: 'Carcasas y medias carcasas porcinas, fresca o refrigerada', en: 'Pork carcases, fresh or chilled' },
  { code: '02061000', es: 'Despojos comestibles de bovino, frescos o refrigerados', en: 'Bovine offal, fresh or chilled' },
  { code: '02071100', es: 'Carne de gallo/gallina sin trocear, fresca o refrigerada', en: 'Whole chickens, fresh or chilled' },
  { code: '02071200', es: 'Carne de gallo/gallina sin trocear, congelada', en: 'Whole chickens, frozen' },
  // ── Chapter 03 — Fish
  { code: '03021100', es: 'Truchas, frescas o refrigeradas', en: 'Trout, fresh or chilled' },
  { code: '03024100', es: 'Atunes de aleta amarilla, frescos o refrigerados', en: 'Yellowfin tunas, fresh or chilled' },
  { code: '03031100', es: 'Salmones del Pacífico, congelados', en: 'Pacific salmon, frozen' },
  { code: '03061700', es: 'Camarones y langostinos congelados', en: 'Frozen shrimps and prawns' },
  // ── Chapter 04 — Dairy
  { code: '04011000', es: 'Leche y nata sin concentrar, materia grasa ≤1%', en: 'Milk and cream, fat ≤1%' },
  { code: '04021000', es: 'Leche y nata en polvo, materia grasa ≤1.5%', en: 'Milk powder, fat ≤1.5%' },
  { code: '04031000', es: 'Yogur', en: 'Yogurt' },
  { code: '04041000', es: 'Lactosuero, modificado o sin modificar', en: 'Whey, modified or not' },
  { code: '04051000', es: 'Mantequilla (manteca)', en: 'Butter' },
  { code: '04061000', es: 'Queso fresco (sin madurar)', en: 'Fresh cheese' },
  { code: '04069000', es: 'Los demás quesos', en: 'Other cheese' },
  // ── Chapter 07 — Vegetables
  { code: '07019000', es: 'Las demás papas frescas o refrigeradas', en: 'Other potatoes, fresh or chilled' },
  { code: '07020000', es: 'Tomates frescos o refrigerados', en: 'Tomatoes, fresh or chilled' },
  { code: '07031000', es: 'Cebollas y chalotes, frescos o refrigerados', en: 'Onions and shallots, fresh' },
  { code: '07070000', es: 'Pepinos y pepinillos, frescos o refrigerados', en: 'Cucumbers, fresh or chilled' },
  { code: '07092000', es: 'Espárragos frescos o refrigerados', en: 'Asparagus, fresh or chilled' },
  // ── Chapter 08 — Fruit
  { code: '08051000', es: 'Naranjas frescas o secas', en: 'Oranges, fresh or dried' },
  { code: '08052000', es: 'Mandarinas, frescas o secas', en: 'Mandarins, fresh or dried' },
  { code: '08061000', es: 'Uvas frescas', en: 'Fresh grapes' },
  { code: '08071100', es: 'Sandías frescas', en: 'Watermelons, fresh' },
  { code: '08081000', es: 'Manzanas frescas', en: 'Apples, fresh' },
  { code: '08091000', es: 'Damascos (albaricoques) frescos', en: 'Apricots, fresh' },
  { code: '08101000', es: 'Fresas (frutillas) frescas', en: 'Strawberries, fresh' },
  // ── Chapter 09 — Coffee, tea, spices
  { code: '09011100', es: 'Café sin tostar, sin descafeinar', en: 'Coffee, not roasted, not decaffeinated' },
  { code: '09021000', es: 'Té verde sin fermentar', en: 'Green tea, not fermented' },
  { code: '09024000', es: 'Té negro fermentado o parcialmente fermentado', en: 'Black fermented tea' },
  { code: '09041100', es: 'Pimienta sin triturar ni pulverizar', en: 'Pepper, not ground' },
  // ── Chapter 10 — Cereals (CRITICAL for AR)
  { code: '10011100', es: 'Trigo duro para siembra', en: 'Durum wheat, for sowing' },
  { code: '10011900', es: 'Los demás trigos duros', en: 'Other durum wheat' },
  { code: '10019100', es: 'Trigo escanda y trigo común para siembra', en: 'Spelt and common wheat, for sowing' },
  { code: '10019900', es: 'Los demás trigos y morcajos', en: 'Other wheat and meslin' },
  { code: '10030000', es: 'Cebada', en: 'Barley' },
  { code: '10030090', es: 'Cebada, excepto para siembra', en: 'Barley, other than for sowing' },
  { code: '10050090', es: 'Los demás maíces', en: 'Other maize' },
  { code: '10059000', es: 'Maíz, excepto para siembra', en: 'Maize (corn), other than seed' },
  { code: '10060000', es: 'Arroz', en: 'Rice' },
  { code: '10061000', es: 'Arroz con cáscara (arroz «paddy»)', en: 'Rice in the husk (paddy or rough)' },
  { code: '10062000', es: 'Arroz descascarillado (arroz cargo o pardo)', en: 'Husked (brown) rice' },
  { code: '10063000', es: 'Arroz semiblanqueado o blanqueado', en: 'Semi-milled or wholly milled rice' },
  { code: '10070000', es: 'Sorgo de grano', en: 'Grain sorghum' },
  // ── Chapter 11 — Milling
  { code: '11010000', es: 'Harina de trigo o de morcajo (tranquillón)', en: 'Wheat or meslin flour' },
  { code: '11022000', es: 'Harina de maíz', en: 'Maize (corn) flour' },
  { code: '11031100', es: 'Sémola y semolina de trigo', en: 'Groats and meal of wheat' },
  // ── Chapter 12 — Oilseeds (CRITICAL for AR)
  { code: '12010000', es: 'Porotos de soja', en: 'Soybeans' },
  { code: '12010090', es: 'Las demás habas de soja', en: 'Other soybeans' },
  { code: '12019000', es: 'Porotos de soja, incluso quebrantados', en: 'Soybeans, whether or not broken' },
  { code: '12024200', es: 'Maníes (cacahuetes) sin cáscara', en: 'Groundnuts, shelled' },
  { code: '12040000', es: 'Semillas de lino, incluso quebrantadas', en: 'Linseed, whether or not broken' },
  { code: '12051000', es: 'Semillas de nabo (nabina) o de colza', en: 'Low erucic acid rape seeds' },
  { code: '12060000', es: 'Semillas de girasol, incluso quebrantadas', en: 'Sunflower seeds, whether or not broken' },
  // ── Chapter 15 — Fats and oils (CRITICAL for AR)
  { code: '15071000', es: 'Aceite de soja en bruto, incluso desgomado', en: 'Crude soybean oil' },
  { code: '15079000', es: 'Los demás aceites de soja y sus fracciones', en: 'Other soybean oil' },
  { code: '15111000', es: 'Aceite de palma en bruto', en: 'Crude palm oil' },
  { code: '15121100', es: 'Aceite de girasol en bruto', en: 'Crude sunflower-seed oil' },
  { code: '15121900', es: 'Aceite de girasol refinado', en: 'Refined sunflower-seed oil' },
  { code: '15141100', es: 'Aceite de colza en bruto', en: 'Crude low erucic acid rape oil' },
  { code: '15179000', es: 'Las demás mezclas o preparaciones alimenticias de grasas', en: 'Other edible mixtures of fats' },
  // ── Chapter 22 — Beverages
  { code: '22011000', es: 'Agua mineral y agua gaseada', en: 'Mineral waters and aerated waters' },
  { code: '22021000', es: 'Agua mineral o gaseada, azucarada o edulcorada', en: 'Waters, mineral or aerated, sweetened' },
  { code: '22030000', es: 'Cerveza de malta', en: 'Beer made from malt' },
  { code: '22041000', es: 'Vino espumoso', en: 'Sparkling wine' },
  { code: '22042100', es: 'Los demás vinos en recipientes ≤2 litros', en: 'Other wine in containers ≤2L' },
  { code: '22042900', es: 'Los demás vinos en recipientes >2 litros', en: 'Other wine in containers >2L' },
  { code: '22071000', es: 'Alcohol etílico sin desnaturalizar, graduación ≥80%', en: 'Undenatured ethyl alcohol, ≥80%' },
  { code: '22082000', es: 'Aguardientes de vino o de orujo de uvas', en: 'Spirits obtained by distilling grape wine' },
  // ── Chapter 23 — Food residues
  { code: '23040000', es: 'Tortas y demás residuos sólidos de extracción del aceite de soja', en: 'Soya-bean oil-cake' },
  { code: '23060000', es: 'Tortas y demás residuos sólidos del girasol', en: 'Sunflower seed oil-cake' },
  { code: '23080000', es: 'Materias vegetales para alimentación animal', en: 'Vegetable materials for animal feed' },
  // ── Chapter 25-27 — Minerals and energy
  { code: '25010000', es: 'Sal (incluidas la de mesa y la desnaturalizada)', en: 'Salt and pure sodium chloride' },
  { code: '26011100', es: 'Minerales de hierro y sus concentrados sin aglomerar', en: 'Non-agglomerated iron ores' },
  { code: '26011200', es: 'Minerales de hierro aglomerados y sus concentrados', en: 'Agglomerated iron ores' },
  { code: '26020000', es: 'Minerales de manganeso y sus concentrados', en: 'Manganese ores and concentrates' },
  { code: '26030000', es: 'Minerales de cobre y sus concentrados', en: 'Copper ores and concentrates' },
  { code: '26080000', es: 'Minerales de cinc y sus concentrados', en: 'Zinc ores and concentrates' },
  { code: '27090000', es: 'Aceites crudos de petróleo o de mineral bituminoso', en: 'Petroleum oils, crude' },
  { code: '27101200', es: 'Aceites livianos (ligeros) y preparaciones de petróleo', en: 'Light oils and preparations' },
  { code: '27111100', es: 'Gas natural licuado', en: 'Liquefied natural gas' },
  { code: '27111200', es: 'Propano licuado', en: 'Liquefied propane' },
  // ── Chapter 28-30 — Chemicals and pharma
  { code: '28080000', es: 'Ácido nítrico; ácidos sulfonítricos', en: 'Nitric acid; sulphonitric acids' },
  { code: '29011000', es: 'Hidrocarburos acíclicos saturados', en: 'Saturated acyclic hydrocarbons' },
  { code: '30041000', es: 'Medicamentos con penicilinas o estreptomicinas', en: 'Medicaments containing penicillins' },
  { code: '30042000', es: 'Medicamentos con antibióticos', en: 'Medicaments containing antibiotics' },
  { code: '30049000', es: 'Los demás medicamentos preparados', en: 'Other medicaments' },
  // ── Chapter 39 — Plastics
  { code: '39011000', es: 'Polietileno de densidad inferior a 0.94', en: 'Polyethylene, density <0.94' },
  { code: '39021000', es: 'Polipropileno', en: 'Polypropylene' },
  { code: '39041000', es: 'Poli(cloruro de vinilo) sin mezclar con otras sustancias', en: 'PVC, not mixed' },
  { code: '39269000', es: 'Las demás manufacturas de plástico', en: 'Other articles of plastics' },
  // ── Chapter 52-63 — Textiles (covers "tela", "hilo", "algodón", "indumentaria")
  { code: '52010000', es: 'Algodón sin cardar ni peinar', en: 'Cotton, not carded or combed' },
  { code: '52052100', es: 'Hilados de algodón sencillo, fibras peinadas', en: 'Single combed cotton yarn' },
  { code: '52081100', es: 'Tejidos de algodón, crudos', en: 'Woven fabrics of cotton, unbleached' },
  { code: '52081200', es: 'Tejidos de algodón, blanqueados', en: 'Woven fabrics of cotton, bleached' },
  { code: '52082100', es: 'Tejidos de algodón en 3 o 4 hilos, crudos', en: 'Three/four-thread twill cotton, unbleached' },
  { code: '52094100', es: 'Tejidos de mezclilla (denim)', en: 'Denim fabrics' },
  { code: '52099000', es: 'Los demás tejidos de algodón', en: 'Other woven fabrics of cotton' },
  { code: '54071000', es: 'Tejidos de filamentos de nylón o poliamidas', en: 'Woven fabrics of nylon filaments' },
  { code: '54075100', es: 'Tejidos de filamentos de poliéster, crudos o blanqueados', en: 'Polyester filament fabrics, unbleached/bleached' },
  { code: '55151100', es: 'Tejidos de fibras de poliéster discontinuas mezcladas', en: 'Woven fabrics of polyester staple fibres' },
  { code: '61091000', es: 'Camisetas de punto de algodón', en: 'T-shirts of cotton, knitted' },
  { code: '62034200', es: 'Pantalones de algodón para hombres', en: "Men's trousers of cotton" },
  { code: '63026000', es: 'Ropa de tocador o de cocina, de tejido con bucles', en: 'Terry towelling of cotton' },
  // ── Chapter 72-74 — Metals
  { code: '72081000', es: 'Productos laminados planos de hierro, en rollos', en: 'Flat-rolled iron products, coils' },
  { code: '72142000', es: 'Barras de hierro o acero, con muescas', en: 'Bars of iron or steel, with indentations' },
  { code: '72249000', es: 'Los demás aceros aleados en lingotes', en: 'Other alloy steel in ingots' },
  { code: '74031100', es: 'Cátodos y secciones de cátodos de cobre refinado', en: 'Copper cathodes, refined' },
  { code: '74031200', es: 'Alambrón de cobre refinado', en: 'Copper wire-bars' },
  // ── Chapter 84-85 — Machinery and electronics
  { code: '84131100', es: 'Bombas para combustibles, lubricantes', en: 'Pumps for fuel or lubricants' },
  { code: '84433100', es: 'Máquinas que efectúan dos o más funciones de impresión', en: 'Machines for multifunction printing' },
  { code: '84713000', es: 'Computadoras portátiles (laptops)', en: 'Portable computers' },
  { code: '84716000', es: 'Unidades de entrada o salida para ordenadores', en: 'Input/output units for computers' },
  { code: '84713000', es: 'Máquinas automáticas de tratamiento de información portátiles', en: 'Portable data processing machines' },
  { code: '84152000', es: 'Aparatos de aire acondicionado', en: 'Air conditioning machines' },
  { code: '85171200', es: 'Teléfonos inteligentes (smartphones)', en: 'Smartphones' },
  { code: '85258000', es: 'Cámaras de televisión, cámaras digitales', en: 'Television cameras, digital cameras' },
  { code: '85299090', es: 'Las demás partes para aparatos de televisión', en: 'Other TV parts' },
  { code: '85423100', es: 'Procesadores y controladores electrónicos', en: 'Electronic processors and controllers' },
  { code: '85044000', es: 'Cargadores y convertidores estáticos de potencia', en: 'Static converters (incl. chargers)' },
  // ── Chapter 87 — Vehicles
  { code: '87012000', es: 'Tractores de carretera para semirremolques', en: 'Road tractors for semi-trailers' },
  { code: '87032200', es: 'Vehículos de turismo, motor 1000-1500cc', en: 'Passenger vehicles, 1000-1500cc' },
  { code: '87032300', es: 'Vehículos de turismo, motor 1500-3000cc', en: 'Passenger vehicles, 1500-3000cc' },
  { code: '87042100', es: 'Vehículos automóviles para transporte de mercancías ≤5t', en: 'Goods vehicles, GVW ≤5t' },
  // ── Chapter 88-90 — Aviation, nautical, instruments
  { code: '88024000', es: 'Aviones y demás aeronaves de peso en vacío >15.000kg', en: 'Aircraft, unladen weight >15,000kg' },
  { code: '89011000', es: 'Transatlánticos, barcos de excursión y ferries', en: 'Cruise ships, excursion boats, ferries' },
  { code: '90181100', es: 'Electrocardiógrafos', en: 'Electrocardiographs' },
  { code: '90213900', es: 'Los demás artículos y aparatos de ortopedia o fractura', en: 'Other orthopaedic appliances' },
];

// ─── Layer 2: Load the embedded 120+ codes (always safe, INSERT OR IGNORE) ──
async function loadEmbedded(db: ReturnType<typeof getSqliteDb>): Promise<number> {
  if (!db) return 0;
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO hs_subpartidas
      (id, code, description, description_en, partida_code, chapter_code, is_active)
    VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, 1)
  `);
  let inserted = 0;
  const tx = db.transaction(() => {
    for (const c of EMBEDDED_HS_CODES) {
      const info = stmt.run(c.code, c.es, c.en, c.code.substring(0, 4), c.code.substring(0, 2));
      inserted += info.changes;
    }
  });
  tx();
  return inserted;
}

// ─── Layer 1: Download full HS 2022 CSV from GitHub in background ────────────
async function downloadAndLoadHsCsv(db: ReturnType<typeof getSqliteDb>): Promise<void> {
  if (!db) return;
  const HS_CSV_URL = 'https://raw.githubusercontent.com/datasets/harmonized-system/master/data/harmonized-system.csv';
  try {
    console.log('[hs-loader] Downloading HS 2022 dataset from GitHub...');
    const res = await fetch(HS_CSV_URL, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csv = await res.text();
    const lines = csv.split('\n').slice(1); // skip header row

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO hs_subpartidas
        (id, code, description, description_en, partida_code, chapter_code, is_active)
      VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, 1)
    `);

    let inserted = 0;
    const tx = db.transaction(() => {
      for (const line of lines) {
        if (!line.trim()) continue;
        // CSV format: Level,Code,Description  (may have quotes)
        const parts = line.match(/^([^,]+),([^,]+),(.+)$/);
        if (!parts) continue;
        const code = parts[2]?.replace(/"/g, '').trim();
        const desc = parts[3]?.replace(/"/g, '').trim();
        if (!code || !desc || code.length < 4) continue;
        const chapter = code.substring(0, 2);
        const partida = code.substring(0, 4);
        const info = stmt.run(code, desc, desc, partida, chapter);
        inserted += info.changes;
      }
    });
    tx();
    console.log(`[hs-loader] ✅ GitHub CSV: ${inserted} new codes inserted`);
  } catch (err: any) {
    console.warn(`[hs-loader] GitHub download failed (${err.message}) — embedded codes still loaded`);
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function loadNcmCodes(): Promise<void> {
  const db = getSqliteDb();
  if (!db) { console.warn('[hs-loader] DB not ready'); return; }

  // Always load embedded codes (they are instant and safe)
  const embedded = await loadEmbedded(db);

  const { count } = db.prepare('SELECT COUNT(*) as count FROM hs_subpartidas').get() as { count: number };
  console.log(`[hs-loader] DB has ${count} HS codes (${embedded} newly inserted from embedded set)`);

  // If we have less than 1000, try downloading the full dataset in background
  if (count < 1000) {
    downloadAndLoadHsCsv(db).catch(() => {}); // Non-blocking
  } else {
    console.log('[hs-loader] Sufficient codes present — skip GitHub download');
  }
}
