// ============================================================
// ARCHIVO: src/components/TradeCalculator.tsx  (REEMPLAZAR)
// Herramienta unificada con los 11 Incoterms 2020 completos
// ============================================================

import { useState, useEffect } from "react";

// ─── LOS 11 INCOTERMS 2020 COMPLETOS ─────────────────────────────────────────
const INCOTERMS_2020 = [
  // ── TODOS LOS MODOS ─────────────────────────────────────────────────────────
  {
    code: "EXW", name: "Ex Works", mode: "any", color: "#6366f1", emoji: "🏭",
    desc: "El vendedor pone la mercancía disponible en su fábrica. El comprador asume absolutamente TODOS los costos y riesgos desde ese punto, incluyendo el despacho de exportación.",
    riskTransfer: "En las instalaciones del vendedor (fábrica/almacén)",
    vendorPays: ["Embalaje de exportación", "Preparación de la mercancía en fábrica"],
    buyerPays: ["Carga en fábrica", "Transporte interno origen", "Despacho exportación AR", "Flete internacional", "Seguro (opcional)", "Despacho importación destino", "Aranceles e impuestos destino", "Transporte interno destino"],
    tip: "⚠️ No recomendado para exportación argentina: el comprador extranjero no puede hacer el despacho aduanero en Argentina fácilmente.",
    bestFor: "Ventas a importadores con mucha experiencia logística",
    costFactor: 0.02,
  },
  {
    code: "FCA", name: "Free Carrier", mode: "any", color: "#8b5cf6", emoji: "🚚",
    desc: "El vendedor entrega al transportista del comprador en el lugar acordado (fábrica o terminal). Si se entrega en fábrica, el comprador carga; si es en terminal, el vendedor carga.",
    riskTransfer: "Cuando la mercancía es entregada al transportista del comprador",
    vendorPays: ["Embalaje", "Despacho de exportación", "Transporte hasta punto de entrega acordado", "Certificado de Origen"],
    buyerPays: ["Flete internacional", "Seguro (opcional)", "Despacho importación", "Aranceles destino", "Transporte final destino"],
    tip: "✅ Muy usado en Argentina para manufacturas y contenedores. Compatible con cartas de crédito (nueva cláusula 2020).",
    bestFor: "Contenedores, multimodal, cuando el comprador elige el barco",
    costFactor: 0.35,
  },
  {
    code: "CPT", name: "Carriage Paid To", mode: "any", color: "#0ea5e9", emoji: "📦",
    desc: "El vendedor paga el flete hasta el destino acordado. PERO el riesgo se transfiere al comprador cuando la mercancía se entrega al primer transportista (¡antes de llegar!)",
    riskTransfer: "Al entregar al primer transportista en origen (antes que el flete cubra la ruta)",
    vendorPays: ["Despacho exportación", "Flete hasta destino acordado", "THC origen"],
    buyerPays: ["Seguro (el comprador debe contratar)", "THC destino", "Despacho importación", "Aranceles destino", "Transporte final"],
    tip: "⚠️ Paradoja: el vendedor paga el flete pero el riesgo se transfiere antes. El comprador DEBE contratar seguro.",
    bestFor: "Multimodal, aéreo, ferroviario",
    costFactor: 0.55,
  },
  {
    code: "CIP", name: "Carriage and Insurance Paid To", mode: "any", color: "#06b6d4", emoji: "🛡️",
    desc: "Como CPT pero el vendedor también contrata seguro hasta destino. Importante: en Incoterms 2020 se actualizó para exigir cobertura ICC A (la más amplia), no solo la mínima.",
    riskTransfer: "Al entregar al primer transportista en origen",
    vendorPays: ["Despacho exportación", "Flete hasta destino", "Seguro cobertura total ICC A (obligatorio)", "THC origen"],
    buyerPays: ["THC destino", "Despacho importación", "Aranceles destino", "Transporte final"],
    tip: "✅ Ideal para productos de alto valor: farmacéuticos, tecnología, maquinaria. El seguro ICC A es el más completo.",
    bestFor: "Productos de alto valor, manufacturados, farmacéuticos",
    costFactor: 0.58,
  },
  {
    code: "DAP", name: "Delivered At Place", mode: "any", color: "#10b981", emoji: "📍",
    desc: "El vendedor entrega en el lugar de destino acordado, lista para ser descargada. El comprador solo descarga y tramita la importación. El vendedor corre el riesgo hasta el destino.",
    riskTransfer: "En el lugar de destino acordado, antes de la descarga",
    vendorPays: ["Despacho exportación", "Flete hasta destino", "Seguro (si quiere protegerse)", "Transporte hasta punto acordado"],
    buyerPays: ["Descarga en destino", "Despacho importación", "Aranceles e impuestos destino"],
    tip: "✅ Excelente para diferenciarte: ofrecés entrega casi puerta a puerta. El comprador solo paga la importación local.",
    bestFor: "Cuando el vendedor tiene buena red logística y quiere ofrecer servicio premium",
    costFactor: 0.72,
  },
  {
    code: "DPU", name: "Delivered at Place Unloaded", mode: "any", color: "#14b8a6", emoji: "🏗️",
    desc: "NUEVO en Incoterms 2020 (reemplaza DAT). El vendedor entrega Y DESCARGA la mercancía en destino. Es el único Incoterm donde el vendedor asume la descarga.",
    riskTransfer: "Una vez descargada la mercancía en el destino acordado",
    vendorPays: ["Todo hasta destino", "Descarga de la mercancía (único Incoterm que incluye esto)", "Flete internacional", "Seguro (opcional pero recomendado)"],
    buyerPays: ["Despacho importación", "Aranceles e impuestos", "Transporte desde punto de descarga"],
    tip: "🆕 Nuevo en 2020. Único Incoterm con descarga incluida. Ideal para terminales, almacenes y obras de construcción.",
    bestFor: "Terminales portuarias, almacenes, obras de construcción",
    costFactor: 0.78,
  },
  {
    code: "DDP", name: "Delivered Duty Paid", mode: "any", color: "#f59e0b", emoji: "🎯",
    desc: "El vendedor lo hace TODO sin excepción: exportación, flete, seguro, importación en destino, aranceles y entrega final. El comprador solo recibe la mercancía.",
    riskTransfer: "En el lugar de destino final acordado, mercancía lista para usar",
    vendorPays: ["Absolutamente todo: despacho exportación, flete, seguro, despacho importación destino, aranceles, transporte hasta la puerta"],
    buyerPays: ["Solo recibe la mercancía — ningún trámite ni costo adicional"],
    tip: "⚠️ Máxima responsabilidad para el exportador argentino. Necesitás agente aduanero en el país destino. Muy costoso pero atractivo para compradores sin experiencia.",
    bestFor: "E-commerce internacional, compradores sin experiencia importadora",
    costFactor: 0.95,
  },
  // ── SOLO MARÍTIMO / FLUVIAL ──────────────────────────────────────────────────
  {
    code: "FAS", name: "Free Alongside Ship", mode: "sea", color: "#3b82f6", emoji: "⚓",
    desc: "El vendedor entrega la mercancía al costado del buque en el puerto de embarque. El comprador carga y asume todo desde ese momento.",
    riskTransfer: "Al costado del buque en el puerto de origen (antes de la carga)",
    vendorPays: ["Transporte interno hasta el puerto", "Despacho de exportación", "Colocación de mercancía al costado del buque"],
    buyerPays: ["Carga en el buque", "Flete marítimo", "Seguro", "Despacho importación", "Descarga y transporte destino"],
    tip: "✅ Muy usado en Argentina para granos a granel (soja, trigo, maíz) desde puertos del Paraná como Rosario.",
    bestFor: "Graneles: granos, minerales, commodities que se cargan directo al barco",
    costFactor: 0.28,
  },
  {
    code: "FOB", name: "Free On Board", mode: "sea", color: "#2563eb", emoji: "🚢",
    desc: "El vendedor entrega la mercancía a bordo del buque. A partir de que supera la borda del barco, el riesgo y los costos son del comprador. El Incoterm más usado en Argentina.",
    riskTransfer: "Cuando la mercancía está a bordo del buque en el puerto de origen",
    vendorPays: ["Transporte hasta el puerto", "Despacho exportación", "Certificado de Origen", "SENASA si aplica", "Carga en el buque", "THC origen"],
    buyerPays: ["Flete marítimo", "Seguro (opcional)", "THC destino", "Despacho importación", "Aranceles destino", "Transporte interno destino"],
    tip: "✅ El Incoterm más usado en Argentina. La mayoría de exportaciones de commodities y manufacturas se cotiza en FOB.",
    bestFor: "Exportación estándar argentina, commodities, manufacturas",
    costFactor: 0.42,
  },
  {
    code: "CFR", name: "Cost and Freight", mode: "sea", color: "#1d4ed8", emoji: "🌊",
    desc: "El vendedor paga el flete hasta el puerto de destino. Sin embargo, el riesgo se transfiere cuando la mercancía está a bordo en origen — el comprador corre el riesgo durante todo el viaje aunque no pague el flete.",
    riskTransfer: "Cuando la mercancía está a bordo en el puerto de origen",
    vendorPays: ["Despacho exportación", "Flete marítimo hasta puerto destino", "THC origen", "Carga en buque"],
    buyerPays: ["Seguro (el vendedor no está obligado — riesgo asimétrico)", "THC destino", "Despacho importación", "Aranceles destino", "Transporte interno destino"],
    tip: "⚠️ Riesgo asimétrico: el comprador corre el riesgo durante el viaje pero el vendedor elige el barco. Se recomienda que el comprador contrate seguro.",
    bestFor: "Cuando el vendedor quiere controlar el flete pero el comprador acepta el riesgo en tránsito",
    costFactor: 0.52,
  },
  {
    code: "CIF", name: "Cost, Insurance and Freight", mode: "sea", color: "#1e40af", emoji: "🔐",
    desc: "El vendedor paga flete y seguro hasta el puerto de destino. Atención: el seguro mínimo es ICC C (básico), menos que en CIP. El riesgo se transfiere igual que en CFR.",
    riskTransfer: "Cuando la mercancía está a bordo en el puerto de origen",
    vendorPays: ["Despacho exportación", "Flete marítimo hasta puerto destino", "Seguro básico mínimo ICC C", "THC origen"],
    buyerPays: ["THC destino", "Despacho importación", "Aranceles e impuestos destino", "Transporte interno destino"],
    tip: "✅ Exigido frecuentemente en cartas de crédito. Diferencia clave con CIP: CIF es solo marítimo y el seguro mínimo es ICC C (no ICC A).",
    bestFor: "Cartas de crédito, commodities, operaciones bancarias internacionales",
    costFactor: 0.55,
  },
];

// ─── DATOS PAÍSES ─────────────────────────────────────────────────────────────
const COUNTRIES = [
  { code: "BR", label: "🇧🇷 Brasil",       dist: 2924,  sea: 7,  road: 3, air: 1 },
  { code: "CL", label: "🇨🇱 Chile",        dist: 1100,  sea: 0,  road: 2, air: 1 },
  { code: "UY", label: "🇺🇾 Uruguay",      dist: 280,   sea: 1,  road: 1, air: 1 },
  { code: "PY", label: "🇵🇾 Paraguay",     dist: 1350,  sea: 0,  road: 2, air: 1 },
  { code: "CN", label: "🇨🇳 China",        dist: 19500, sea: 35, road: 0, air: 2 },
  { code: "US", label: "🇺🇸 EE.UU.",       dist: 11800, sea: 22, road: 0, air: 2 },
  { code: "DE", label: "🇩🇪 Alemania",     dist: 12200, sea: 21, road: 0, air: 2 },
  { code: "NL", label: "🇳🇱 Países Bajos", dist: 11900, sea: 20, road: 0, air: 2 },
  { code: "ES", label: "🇪🇸 España",       dist: 10400, sea: 18, road: 0, air: 2 },
  { code: "MX", label: "🇲🇽 México",       dist: 8900,  sea: 18, road: 0, air: 2 },
  { code: "PE", label: "🇵🇪 Perú",         dist: 3800,  sea: 10, road: 5, air: 1 },
  { code: "IN", label: "🇮🇳 India",        dist: 14200, sea: 28, road: 0, air: 2 },
  { code: "ID", label: "🇮🇩 Indonesia",    dist: 16800, sea: 32, road: 0, air: 3 },
];

const DUTIES: Record<string, number> = { "12": 33, "15": 31, "23": 31, "10": 12, "02": 9, "22": 0, "08": 5, "41": 5, default: 0 };
const TARIFFS: Record<string, Record<string, number>> = {
  BR: { default: 0, "22": 20 }, CL: { default: 0 }, UY: { default: 0 }, PY: { default: 0 },
  CN: { default: 9, "10": 3, "12": 3, "02": 12 }, US: { default: 3.5, "02": 4, "22": 16 },
  DE: { default: 5, "10": 0, "02": 12, "22": 32 }, NL: { default: 5, "02": 12 }, ES: { default: 5, "02": 12, "22": 32 },
  MX: { default: 15, "10": 10 }, PE: { default: 4, "10": 0 }, IN: { default: 30, "10": 50 }, ID: { default: 10 },
};
const TREATIES: Record<string, string> = {
  BR: "MERCOSUR — 0%", CL: "ACE-35 — 0%", UY: "MERCOSUR — 0%", PY: "MERCOSUR — 0%",
  PE: "ACE-58", MX: "ACE-6", DE: "SGP Europeo", NL: "SGP Europeo", ES: "SGP Europeo",
  US: "SGP USA", CN: "NMF OMC", IN: "NMF OMC (alto)", ID: "NMF OMC",
};
const FREIGHT_BASE: Record<string, Record<string, number>> = {
  sea: { BR: 180, UY: 120, CN: 1200, US: 1100, DE: 1050, NL: 1000, ES: 950, MX: 900, PE: 400, IN: 1100, ID: 1300, PY: 150, default: 800 },
  road: { BR: 280, CL: 220, UY: 150, PY: 200, PE: 600, default: 300 },
  air: { default: 0 },
};

function calcBase(dest: string, kg: number, m3: number, fob: number, ch2: string, mode: "sea"|"road"|"air") {
  const ctry = COUNTRIES.find(c => c.code === dest)!;
  const distKm = ctry?.dist || 8000;
  const transit = (mode === "sea" ? ctry?.sea : mode === "road" ? ctry?.road : ctry?.air) || 20;
  const tons = kg / 1000;
  let freight = 0;
  if (mode === "air") { freight = Math.max(Math.max(kg, m3 * 167) * distKm * 0.00028, 500); }
  else { const base = FREIGHT_BASE[mode]?.[dest] ?? FREIGHT_BASE[mode]?.["default"] ?? 800; freight = Math.max(base * tons + base * 0.008 * distKm * tons * 0.1, base * 0.5); }
  const ins = fob * 0.005;
  const dutyRate = DUTIES[ch2] ?? DUTIES["default"] ?? 0;
  const isFood = /^(0[1-9]|1[0-9]|2[0-3])$/.test(ch2);
  const ar = { derechoExportacion: Math.round(fob * dutyRate / 100), despachoAduanero: 350, certificadoOrigen: 80, verificacionSENASA: isFood ? 120 : 0, gastosBancarios: 150, THC_origen: mode !== "road" ? 200 : 0, precintado: 50 };
  const totalAr = Object.values(ar).reduce((a, b) => a + b, 0);
  const cif = fob + freight + ins;
  const tariffR = (TARIFFS[dest]?.[ch2] ?? TARIFFS[dest]?.["default"] ?? 10);
  const dst = { derechoImportacion: Math.round(cif * tariffR / 100), THC_destino: mode !== "road" ? 250 : 0, despachoImportacion: 400, almacenaje: Math.round(transit * 15) };
  const totalDst = Object.values(dst).reduce((a, b) => a + b, 0);
  return { fob: Math.round(fob), freight: Math.round(freight), ins: Math.round(ins), cif: Math.round(cif), ar, totalAr: Math.round(totalAr), dutyRate, dst, totalDst: Math.round(totalDst), tariffR, landed: Math.round(fob + freight + ins + totalAr + totalDst), distKm, transit, treaty: TREATIES[dest] || "NMF", alert: dutyRate > 20 ? `⚠️ Retención ${dutyRate}% sobre FOB` : null };
}

function vendorCostForInco(inc: typeof INCOTERMS_2020[0], c: ReturnType<typeof calcBase>) {
  const extraForDest = c.dst.THC_destino + c.dst.almacenaje;
  switch(inc.code) {
    case "EXW": return Math.round(c.ar.precintado + 50);
    case "FCA": return Math.round(c.ar.derechoExportacion + c.ar.despachoAduanero + c.ar.certificadoOrigen + c.ar.verificacionSENASA + c.ar.gastosBancarios + 150);
    case "FAS": return Math.round(c.totalAr - c.ar.THC_origen + c.ar.THC_origen * 0.5);
    case "FOB": return Math.round(c.totalAr);
    case "CFR": case "CPT": return Math.round(c.totalAr + c.freight);
    case "CIF": case "CIP": return Math.round(c.totalAr + c.freight + c.ins);
    case "DAP": return Math.round(c.totalAr + c.freight + c.ins + extraForDest);
    case "DPU": return Math.round(c.totalAr + c.freight + c.ins + extraForDest + 300);
    case "DDP": return Math.round(c.totalAr + c.freight + c.ins + c.totalDst + 500);
    default: return Math.round(c.totalAr);
  }
}

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@400;700;800&display=swap');
  .tc{font-family:'Syne',sans-serif;--bg:#07111d;--sf:#0d2035;--bd:#1a3a5a;--ac:#00d4ff;--wn:#f59e0b;--ok:#22c55e;--tx:#cce8ff;--mu:#5a8aaa}
  .tc *{box-sizing:border-box}
  .tc input:focus,.tc select:focus{border-color:var(--ac)!important;outline:none}
  .btn{transition:all .15s}.btn:hover:not(:disabled){opacity:.85;transform:translateY(-1px)}.btn:active:not(:disabled){transform:none}
  .inc:hover{transform:translateY(-2px);transition:transform .2s}
  .fd{animation:fd .3s ease}@keyframes fd{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  .pulse{animation:pl 1.4s infinite}@keyframes pl{0%,100%{opacity:1}50%{opacity:.4}}
  ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#07111d}::-webkit-scrollbar-thumb{background:#1a3a5a;border-radius:4px}
`;

interface Props { defaultDestination?: string; defaultProduct?: string; defaultHsCode?: string; onClose?: () => void; }

export default function TradeCalculator({ defaultDestination = "BR", defaultProduct = "", defaultHsCode = "1001.99.00", onClose }: Props) {
  const [tab, setTab] = useState<"logistics"|"costs"|"incoterms"|"profit">("logistics");
  const [dest, setDest] = useState(defaultDestination);
  const [mode, setMode] = useState<"sea"|"road"|"air">("sea");
  const [kg, setKg] = useState("1000");
  const [m3, setM3] = useState("3");
  const [fob, setFob] = useState("50000");
  const [ch, setCh] = useState(defaultHsCode.substring(0, 2) || "10");
  const [prodCost, setProdCost] = useState("30000");
  const [price, setPrice] = useState("55");
  const [qty, setQty] = useState("1000");
  const [selInco, setSelInco] = useState("CIF");
  const [result, setResult] = useState<ReturnType<typeof calcBase>|null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const c = COUNTRIES.find(c => c.code === dest);
    if (!c) return;
    if (mode === "sea" && !c.sea) setMode(c.road ? "road" : "air");
    if (mode === "road" && !c.road) setMode(c.sea ? "sea" : "air");
  }, [dest]);

  const calculate = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 250));
    try {
      let data: ReturnType<typeof calcBase>|null = null;
      try {
        const p = new URLSearchParams({ origin:"AR", destination:dest, weightKg:kg, volumeM3:m3, fobValueUSD:fob, hsChapter:ch, mode });
        const res = await fetch(`/api/logistics/calculate?${p}`);
        if (res.ok) {
          const d = await res.json();
          data = { fob: d.costs.fobValue, freight: d.costs.freight, ins: d.costs.insurance, cif: d.costs.cifValue, ar: d.costs.arExportCosts, totalAr: d.costs.totalArExport, dutyRate: d.costs.exportDutyRate, dst: d.costs.destCosts, totalDst: d.costs.totalDestCosts, tariffR: d.costs.tariffRate, landed: d.costs.totalLandedCost, distKm: d.route.distanceKm, transit: d.route.transitDays, treaty: d.summary.tariffTreaty, alert: d.summary.alert };
        }
      } catch {}
      setResult(data || calcBase(dest, +kg, +m3, +fob, ch.padStart(2,"0").substring(0,2), mode));
    } finally { setLoading(false); }
  };

  const c = result;
  const selIncoTerm = INCOTERMS_2020.find(i => i.code === selInco)!;
  const availableIncos = INCOTERMS_2020.filter(i => i.mode === "any" || i.mode === mode);
  const countryLabel = COUNTRIES.find(x => x.code === dest)?.label || dest;

  const profit = c ? (() => {
    const vc = selIncoTerm ? vendorCostForInco(selIncoTerm, c) : c.totalAr;
    const rev = +price * +qty, pc = +prodCost, gp = rev - pc - vc;
    return { rev: Math.round(rev), pc: Math.round(pc), vc: Math.round(vc), gp: Math.round(gp), margin: rev > 0 ? ((gp/rev)*100).toFixed(1) : "0", roi: pc > 0 ? ((gp/pc)*100).toFixed(1) : "0", be: (pc+vc) > 0 ? Math.ceil((pc+vc)/(+price||1)) : 0, minPrice: Math.round((pc+vc)/(+qty||1)) };
  })() : null;

  const iS = { width:"100%", padding:"10px 12px", background:"var(--sf)", border:"1px solid var(--bd)", borderRadius:"8px", color:"var(--tx)", fontSize:"14px", fontFamily:"'JetBrains Mono',monospace" } as const;
  const lS = { fontSize:"10px", color:"var(--mu)", letterSpacing:".8px", textTransform:"uppercase" as const, marginBottom:"6px", fontWeight:600, display:"block" };
  const cS = { background:"var(--sf)", border:"1px solid var(--bd)", borderRadius:"12px", padding:"18px" };
  const rS = { display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #122033", fontSize:"13px" } as const;

  const TABS = [
    { k:"logistics", l:"🚢 Logística", s:"Rutas · Fletes · Tiempos" },
    { k:"costs", l:"🧾 Costos", s:"Arancel · Aduana · Landed Cost" },
    { k:"incoterms", l:"⚖️ Incoterms 2020", s:"11 contratos · Comparativa" },
    { k:"profit", l:"📈 Rentabilidad", s:"Margen · ROI · Equilibrio" },
  ] as const;

  const AR_LABELS: Record<string, string> = { derechoExportacion:"Derecho exportación", despachoAduanero:"Despacho aduanero", certificadoOrigen:"Certificado Origen", verificacionSENASA:"SENASA / Sanidad", gastosBancarios:"Gastos bancarios", THC_origen:"THC puerto origen", precintado:"Precintado" };

  return (
    <>
      <style>{CSS}</style>
      <div className="tc" style={{ position:"fixed", inset:0, background:"rgba(0,5,12,.85)", backdropFilter:"blur(6px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }} onClick={e => e.target === e.currentTarget && onClose?.()}>
        <div style={{ background:"var(--bg)", border:"1px solid var(--bd)", borderRadius:"18px", width:"100%", maxWidth:"1000px", maxHeight:"92vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,.7)" }}>

          {/* HEADER */}
          <div style={{ padding:"20px 28px 0", background:"linear-gradient(180deg,#0d2035,var(--bg))", borderRadius:"18px 18px 0 0" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"18px" }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                  <h2 style={{ margin:0, fontSize:"20px", fontWeight:800, color:"var(--ac)", letterSpacing:"-0.5px" }}>⚡ Trade Calculator</h2>
                  <span style={{ fontSize:"11px", background:"#00d4ff22", color:"var(--ac)", padding:"2px 8px", borderRadius:"20px", border:"1px solid #00d4ff44", fontWeight:600 }}>Che.Comex</span>
                </div>
                <div style={{ color:"var(--mu)", fontSize:"12px", marginTop:"4px" }}>AR → {countryLabel}{defaultProduct ? ` · ${defaultProduct}` : ""} · Logística + Costos + 11 Incoterms 2020 + Rentabilidad</div>
              </div>
              {onClose && <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--mu)", fontSize:"22px", cursor:"pointer" }}>×</button>}
            </div>
            <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
              {TABS.map(t => (
                <button key={t.k} onClick={() => setTab(t.k)} style={{ padding:"10px 18px", border:"none", borderRadius:"10px 10px 0 0", cursor:"pointer", background:tab===t.k?"var(--sf)":"transparent", borderBottom:tab===t.k?"2px solid var(--ac)":"2px solid transparent", color:tab===t.k?"var(--ac)":"var(--mu)", fontFamily:"inherit", fontWeight:tab===t.k?700:400, fontSize:"13px" }}>
                  <div>{t.l}</div><div style={{ fontSize:"10px", opacity:.7 }}>{t.s}</div>
                </button>
              ))}
            </div>
          </div>

          {/* BODY */}
          <div style={{ padding:"24px 28px" }}>
            {/* INPUTS */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:"12px", marginBottom:"16px" }}>
              <div><label style={lS}>País destino</label><select style={{ ...iS, cursor:"pointer" }} value={dest} onChange={e=>setDest(e.target.value)}>{COUNTRIES.map(x=><option key={x.code} value={x.code}>{x.label}</option>)}</select></div>
              <div><label style={lS}>Transporte</label><select style={{ ...iS, cursor:"pointer" }} value={mode} onChange={e=>setMode(e.target.value as any)}><option value="sea">🚢 Marítimo</option><option value="road">🚛 Terrestre</option><option value="air">✈️ Aéreo</option></select></div>
              <div><label style={lS}>Capítulo HS</label><input style={iS} type="text" maxLength={2} value={ch} onChange={e=>setCh(e.target.value)} placeholder="10"/></div>
              <div><label style={lS}>Peso (kg)</label><input style={iS} type="number" value={kg} onChange={e=>setKg(e.target.value)}/></div>
              <div><label style={lS}>Volumen (m³)</label><input style={iS} type="number" value={m3} onChange={e=>setM3(e.target.value)}/></div>
              <div><label style={lS}>Valor FOB (USD)</label><input style={iS} type="number" value={fob} onChange={e=>setFob(e.target.value)}/></div>
            </div>
            {tab === "profit" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px", marginBottom:"16px", padding:"14px", background:"var(--sf)", borderRadius:"10px", border:"1px solid var(--bd)" }}>
                <div><label style={lS}>Costo producción total (USD)</label><input style={iS} type="number" value={prodCost} onChange={e=>setProdCost(e.target.value)}/></div>
                <div><label style={lS}>Precio venta / unidad (USD)</label><input style={iS} type="number" value={price} onChange={e=>setPrice(e.target.value)}/></div>
                <div><label style={lS}>Unidades a exportar</label><input style={iS} type="number" value={qty} onChange={e=>setQty(e.target.value)}/></div>
              </div>
            )}
            <button className="btn" onClick={calculate} disabled={loading} style={{ width:"100%", padding:"13px", borderRadius:"10px", border:"none", background:loading?"var(--bd)":"linear-gradient(135deg,#0055cc,#00d4ff)", color:"#fff", fontSize:"15px", fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", marginBottom:"24px" }}>
              {loading ? <span className="pulse">Calculando...</span> : "⚡ Calcular"}
            </button>

            {c && (
              <div className="fd">
                {c.alert && <div style={{ background:"#1c1200", border:"1px solid var(--wn)", borderRadius:"8px", padding:"10px 14px", marginBottom:"16px", fontSize:"13px", color:"var(--wn)" }}>{c.alert}</div>}

                {/* KPIs */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px", marginBottom:"24px" }}>
                  {[
                    { l:"Landed Cost", v:fmt(c.landed), col:"var(--wn)", i:"📦" },
                    { l:"Valor CIF", v:fmt(c.cif), col:"var(--ac)", i:"🚢" },
                    { l:"Tránsito", v:`${c.transit} días`, col:"var(--ok)", i:"⏱" },
                    { l:"Tratado", v:c.treaty.split("—")[0].trim(), col:"#a78bfa", i:"📜" },
                  ].map(({ l,v,col,i }) => (
                    <div key={l} style={{ background:"var(--sf)", border:"1px solid var(--bd)", borderRadius:"10px", padding:"14px" }}>
                      <div style={{ fontSize:"18px", marginBottom:"6px" }}>{i}</div>
                      <div style={{ fontSize:"10px", color:"var(--mu)", textTransform:"uppercase", letterSpacing:".6px", marginBottom:"4px" }}>{l}</div>
                      <div style={{ fontSize:"16px", fontWeight:700, color:col, fontFamily:"'JetBrains Mono',monospace" }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* TAB LOGÍSTICA */}
                {tab === "logistics" && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
                    <div style={cS}>
                      <div style={{ ...lS, marginBottom:"14px" }}>📍 Ruta y costos base</div>
                      {[["Distancia",`${c.distKm.toLocaleString()} km`],["Tránsito",`${c.transit} días`],["Flete",fmt(c.freight)],["Seguro",fmt(c.ins)],["CIF destino",fmt(c.cif)],["Tratado",c.treaty],["Arancel destino",`${c.tariffR}%`]].map(([k,v])=>(
                        <div key={k as string} style={rS}><span style={{ color:"var(--mu)" }}>{k}</span><span style={{ fontWeight:600 }}>{v}</span></div>
                      ))}
                    </div>
                    <div style={cS}>
                      <div style={{ ...lS, marginBottom:"12px" }}>💡 Incoterms disponibles — click para detalle</div>
                      {availableIncos.map(inc => {
                        const vc = vendorCostForInco(inc, c);
                        return (
                          <div key={inc.code} className="inc" onClick={() => { setSelInco(inc.code); setTab("incoterms"); }}
                            style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 10px", borderRadius:"8px", marginBottom:"6px", cursor:"pointer", background:"#0b1929", border:`1px solid ${inc.color}44` }}>
                            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                              <span>{inc.emoji}</span>
                              <div><span style={{ fontWeight:700, color:inc.color, fontSize:"13px" }}>{inc.code}</span><span style={{ fontSize:"11px", color:"var(--mu)", marginLeft:"6px" }}>{inc.name}</span></div>
                            </div>
                            <div style={{ textAlign:"right" }}>
                              <div style={{ fontSize:"12px", fontWeight:600, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(vc)}</div>
                              <div style={{ fontSize:"10px", color:"var(--mu)" }}>vendedor</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB COSTOS */}
                {tab === "costs" && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
                    <div style={cS}>
                      <div style={{ ...lS, marginBottom:"14px" }}>🇦🇷 Costos exportación Argentina</div>
                      {Object.entries(c.ar).filter(([,v])=>v>0).map(([k,v])=>(
                        <div key={k} style={rS}><span style={{ color:"var(--mu)", fontSize:"12px" }}>{AR_LABELS[k]||k}</span><span style={{ fontWeight:600, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(v)}</span></div>
                      ))}
                      {c.dutyRate > 0 && <div style={{ background:"#1c1200", borderRadius:"6px", padding:"8px", marginTop:"8px", fontSize:"12px", color:"var(--wn)" }}>⚠️ Retención {c.dutyRate}% incluida</div>}
                      <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0 0", fontWeight:700, color:"var(--ac)", borderTop:"1px solid var(--bd)", marginTop:"6px", fontSize:"15px", fontFamily:"'JetBrains Mono',monospace" }}><span>Subtotal AR</span><span>{fmt(c.totalAr)}</span></div>
                    </div>
                    <div style={cS}>
                      <div style={{ ...lS, marginBottom:"14px" }}>📊 Estructura precio completa</div>
                      {[
                        { l:"Valor FOB", v:c.fob, col:"var(--tx)" },
                        { l:"Costos AR", v:c.totalAr, col:"var(--tx)" },
                        { l:"Flete", v:c.freight, col:"var(--tx)" },
                        { l:"Seguro", v:c.ins, col:"var(--tx)" },
                        { l:"Valor CIF", v:c.cif, col:"var(--ac)", b:true },
                        { l:`Arancel (${c.tariffR}%)`, v:c.dst.derechoImportacion, col:"var(--tx)" },
                        { l:"THC + despacho destino", v:(c.dst.THC_destino||0)+(c.dst.despachoImportacion||0), col:"var(--tx)" },
                        { l:"Almacenaje", v:c.dst.almacenaje||0, col:"var(--tx)" },
                      ].map(({ l,v,col,b })=>(
                        <div key={l} style={rS}><span style={{ color:"var(--mu)", fontSize:"12px" }}>{l}</span><span style={{ fontWeight:b?700:500, color:col, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(v)}</span></div>
                      ))}
                      <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0 0", fontWeight:700, color:"var(--wn)", borderTop:"1px solid var(--bd)", marginTop:"6px", fontSize:"16px", fontFamily:"'JetBrains Mono',monospace" }}><span>LANDED COST</span><span>{fmt(c.landed)}</span></div>
                    </div>
                  </div>
                )}

                {/* TAB INCOTERMS — LOS 11 */}
                {tab === "incoterms" && (
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px", flexWrap:"wrap" }}>
                      <span style={{ fontSize:"12px", color:"var(--mu)" }}>Modo: <strong style={{ color:"var(--ac)" }}>{mode==="sea"?"🚢 Marítimo":mode==="road"?"🚛 Terrestre":"✈️ Aéreo"}</strong></span>
                      <span style={{ fontSize:"12px", color:"var(--mu)" }}>{availableIncos.length} disponibles — {11-availableIncos.length} solo marítimo (deshabilitados)</span>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:"12px", marginBottom:"24px" }}>
                      {INCOTERMS_2020.map(inc => {
                        const avail = inc.mode==="any" || inc.mode===mode;
                        const vc = avail ? vendorCostForInco(inc, c) : 0;
                        const bc = avail ? Math.max(c.landed - c.fob - vc + c.dst.derechoImportacion + c.dst.despachoImportacion, 0) : 0;
                        const isSel = selInco === inc.code;
                        return (
                          <div key={inc.code} className="inc" onClick={() => avail && setSelInco(inc.code)}
                            style={{ background:isSel?`${inc.color}18`:"var(--sf)", border:`1px solid ${isSel?inc.color:avail?"var(--bd)":"#0d1f2f"}`, borderRadius:"12px", padding:"14px", cursor:avail?"pointer":"not-allowed", opacity:avail?1:.35, position:"relative" as const }}>
                            {!avail && <div style={{ position:"absolute", top:"8px", right:"8px", fontSize:"10px", background:"#1a3a5a", padding:"2px 6px", borderRadius:"4px", color:"var(--mu)" }}>Solo marítimo</div>}
                            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px" }}>
                              <span style={{ fontSize:"20px" }}>{inc.emoji}</span>
                              <div><span style={{ fontSize:"16px", fontWeight:800, color:inc.color }}>{inc.code}</span><span style={{ fontSize:"11px", color:"var(--mu)", marginLeft:"6px" }}>{inc.name}</span></div>
                              {isSel && <span style={{ marginLeft:"auto", fontSize:"10px", background:inc.color, color:"#000", padding:"2px 6px", borderRadius:"10px", fontWeight:700 }}>✓ Sel.</span>}
                            </div>
                            <div style={{ fontSize:"12px", color:"var(--mu)", marginBottom:"10px", lineHeight:1.5 }}>{inc.desc.substring(0,100)}…</div>
                            {avail && (
                              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                                <div style={{ background:"#0b1929", borderRadius:"6px", padding:"8px" }}>
                                  <div style={{ fontSize:"10px", color:"var(--mu)" }}>🏭 Vendedor</div>
                                  <div style={{ fontSize:"14px", fontWeight:700, color:inc.color, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(vc)}</div>
                                </div>
                                <div style={{ background:"#0b1929", borderRadius:"6px", padding:"8px" }}>
                                  <div style={{ fontSize:"10px", color:"var(--mu)" }}>🏪 Comprador</div>
                                  <div style={{ fontSize:"14px", fontWeight:700, color:"var(--wn)", fontFamily:"'JetBrains Mono',monospace" }}>{fmt(bc)}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* DETALLE DEL SELECCIONADO */}
                    {selIncoTerm && (
                      <div style={{ ...cS, border:`1px solid ${selIncoTerm.color}66` }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px" }}>
                          <span style={{ fontSize:"28px" }}>{selIncoTerm.emoji}</span>
                          <div>
                            <div style={{ fontSize:"20px", fontWeight:800, color:selIncoTerm.color }}>{selIncoTerm.code} — {selIncoTerm.name}</div>
                            <div style={{ fontSize:"12px", color:"var(--mu)", marginTop:"2px" }}>{selIncoTerm.mode==="sea"?"🚢 Solo marítimo/fluvial":"✅ Todos los modos de transporte"}</div>
                          </div>
                        </div>
                        <div style={{ fontSize:"14px", color:"var(--tx)", lineHeight:1.6, marginBottom:"16px", padding:"12px", background:"#0b1929", borderRadius:"8px" }}>{selIncoTerm.desc}</div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"14px" }}>
                          <div>
                            <div style={{ fontSize:"11px", color:"#0090ff", fontWeight:700, marginBottom:"8px", textTransform:"uppercase" as const, letterSpacing:".6px" }}>🏭 Vendedor (Argentina) paga</div>
                            {selIncoTerm.vendorPays.map(p=><div key={p} style={{ display:"flex", gap:"6px", padding:"4px 0", fontSize:"13px" }}><span style={{ color:"#0090ff", flexShrink:0 }}>✓</span><span style={{ color:"var(--tx)" }}>{p}</span></div>)}
                          </div>
                          <div>
                            <div style={{ fontSize:"11px", color:"var(--wn)", fontWeight:700, marginBottom:"8px", textTransform:"uppercase" as const, letterSpacing:".6px" }}>🏪 Comprador (destino) paga</div>
                            {selIncoTerm.buyerPays.map(p=><div key={p} style={{ display:"flex", gap:"6px", padding:"4px 0", fontSize:"13px" }}><span style={{ color:"var(--wn)", flexShrink:0 }}>✓</span><span style={{ color:"var(--tx)" }}>{p}</span></div>)}
                          </div>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" }}>
                          {[
                            { l:"Transferencia de riesgo", v:selIncoTerm.riskTransfer },
                            { l:"Mejor para", v:selIncoTerm.bestFor },
                            { l:"Tip Che.Comex", v:selIncoTerm.tip },
                          ].map(({ l,v })=>(
                            <div key={l} style={{ background:"#0b1929", borderRadius:"8px", padding:"10px" }}>
                              <div style={{ fontSize:"10px", color:"var(--mu)", textTransform:"uppercase" as const, letterSpacing:".6px", marginBottom:"6px" }}>{l}</div>
                              <div style={{ fontSize:"12px", color:"var(--tx)", lineHeight:1.5 }}>{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB RENTABILIDAD */}
                {tab === "profit" && profit && (
                  <div>
                    <div style={{ marginBottom:"14px", padding:"10px 14px", background:"var(--sf)", borderRadius:"8px", fontSize:"12px", color:"var(--mu)" }}>
                      Calculando con Incoterm: <strong style={{ color:selIncoTerm?.color||"var(--ac)" }}>{selInco}</strong> — costo del vendedor {fmt(profit.vc)}. Cambialo en el tab ⚖️ Incoterms para comparar.
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px", marginBottom:"20px" }}>
                      {[
                        { l:"Ingreso total", v:fmt(profit.rev), col:"var(--ok)", i:"💵", s:`${qty}u × $${price}` },
                        { l:"Ganancia bruta", v:fmt(profit.gp), col:profit.gp>0?"var(--ok)":"#ef4444", i:profit.gp>0?"✅":"❌", s:profit.gp>0?"Rentable":"En pérdida" },
                        { l:"Margen bruto", v:`${profit.margin}%`, col:+profit.margin>20?"var(--ok)":+profit.margin>5?"var(--wn)":"#ef4444", i:"📊", s:+profit.margin>20?"Excelente":+profit.margin>5?"Aceptable":"Revisar" },
                        { l:"ROI", v:`${profit.roi}%`, col:+profit.roi>15?"var(--ok)":"var(--wn)", i:"🔄", s:"Sobre costo producción" },
                      ].map(({ l,v,col,i,s })=>(
                        <div key={l} style={{ background:"var(--sf)", border:`1px solid ${col}44`, borderRadius:"12px", padding:"16px" }}>
                          <div style={{ fontSize:"22px", marginBottom:"6px" }}>{i}</div>
                          <div style={{ fontSize:"10px", color:"var(--mu)", textTransform:"uppercase" as const, letterSpacing:".6px" }}>{l}</div>
                          <div style={{ fontSize:"22px", fontWeight:800, color:col, margin:"4px 0", fontFamily:"'JetBrains Mono',monospace" }}>{v}</div>
                          <div style={{ fontSize:"11px", color:"var(--mu)" }}>{s}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
                      <div style={cS}>
                        <div style={{ ...lS, marginBottom:"14px" }}>📋 P&L exportación</div>
                        {[
                          { l:"Ingresos totales", v:profit.rev, pos:true },
                          { l:"Costo de producción", v:-profit.pc, pos:false },
                          { l:`Costos ${selInco} (vendedor)`, v:-profit.vc, pos:false },
                          { l:"GANANCIA BRUTA", v:profit.gp, pos:profit.gp>0, b:true },
                        ].map(({ l,v,pos,b })=>(
                          <div key={l} style={rS}><span style={{ color:"var(--mu)", fontSize:"12px" }}>{l}</span><span style={{ fontWeight:b?700:500, color:pos?"var(--ok)":"#ef4444", fontFamily:"'JetBrains Mono',monospace" }}>{v>=0?fmt(v):`-${fmt(Math.abs(v))}`}</span></div>
                        ))}
                      </div>
                      <div style={cS}>
                        <div style={{ ...lS, marginBottom:"14px" }}>🎯 Indicadores</div>
                        {[
                          { l:"Punto equilibrio", v:`${profit.be.toLocaleString()} unidades` },
                          { l:"Precio mínimo rentable", v:fmt(profit.minPrice) },
                          { l:"Precio actual", v:fmt(+price) },
                          { l:"Margen por unidad", v:fmt(+price - profit.minPrice) },
                        ].map(({ l,v })=>(
                          <div key={l} style={rS}><span style={{ color:"var(--mu)", fontSize:"12px" }}>{l}</span><span style={{ fontWeight:600, fontFamily:"'JetBrains Mono',monospace" }}>{v}</span></div>
                        ))}
                        <div style={{ marginTop:"12px", padding:"12px", background:profit.gp>0?"#00200f":"#200000", borderRadius:"8px", fontSize:"12px", color:profit.gp>0?"var(--ok)":"#ef4444", lineHeight:1.5 }}>
                          {profit.gp>0 ? `✅ Rentable con ${selInco}. Necesitás ${profit.be} unidades para el punto de equilibrio. Ganás ${fmt(+price-profit.minPrice)} por unidad.` : `❌ Con ${selInco} no cubrís costos. Necesitás precio mínimo de ${fmt(profit.minPrice)}/u o elegí un Incoterm donde el comprador asuma más gastos.`}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
