// ============================================================
// ARCHIVO: src/components/TradeCalculator.tsx
// Rediseño PyME: Incoterm óptimo → Desglose → Rentabilidad
// ============================================================

import { useState } from "react";
import { useTrade } from "@/context/trade-context";

// ─── INCOTERMS (solo los esenciales para PyMEs exportadoras AR) ───────────────
const ALL_INCOTERMS: Record<string, {
  name: string; emoji: string; color: string;
  vendorPct: number; // % de costos que asume el vendedor (visual)
  tip: string; bestFor: string;
  vendorPays: string[]; buyerPays: string[];
  riskPoint: string;
}> = {
  EXW: { name:"Ex Works", emoji:"🏭", color:"#6366f1", vendorPct:5, tip:"El comprador hace TODO. No recomendado: el extranjero no puede hacer el despacho en AR fácilmente.", bestFor:"Importadores con logística propia", riskPoint:"En fábrica del vendedor", vendorPays:["Embalaje básico","Preparación en planta"], buyerPays:["Carga en fábrica","Transporte interno","Despacho exportación AR","Flete internacional","Seguro","Aduana destino","Transporte destino"] },
  FCA: { name:"Free Carrier", emoji:"🚚", color:"#8b5cf6", vendorPct:28, tip:"El estándar moderno para contenedores. Compatible con cartas de crédito.", bestFor:"Contenedores, multimodal, PyMEs que empiezan", riskPoint:"Al entregar al transportista del comprador", vendorPays:["Embalaje","Despacho exportación AR","Certificado de Origen","Transporte hasta punto acordado"], buyerPays:["Flete internacional","Seguro","Aduana destino","Transporte destino"] },
  FAS: { name:"Free Alongside Ship", emoji:"⚓", color:"#3b82f6", vendorPct:22, tip:"Usado para graneles: granos, minerales. Entregás al costado del buque en Rosario/BA.", bestFor:"Graneles agrícolas: soja, trigo, maíz, girasol", riskPoint:"Al costado del buque en puerto de origen", vendorPays:["Transporte al puerto","Despacho exportación","Al costado del barco"], buyerPays:["Carga en buque","Flete","Seguro","Aduana destino"] },
  FOB: { name:"Free On Board", emoji:"🚢", color:"#2563eb", vendorPct:38, tip:"El más usado en Argentina. Vos ponés la mercancía a bordo y el comprador paga el flete.", bestFor:"Commodities y manufacturas en contenedor", riskPoint:"Cuando la mercancía está a bordo del buque", vendorPays:["Transporte al puerto","Despacho exportación","Certificado de Origen","SENASA si aplica","Carga en buque","THC origen"], buyerPays:["Flete marítimo","Seguro","THC destino","Aduana destino","Transporte destino"] },
  CFR: { name:"Cost & Freight", emoji:"🌊", color:"#0284c7", vendorPct:52, tip:"Vos pagás el flete pero el riesgo se transfiere en origen. El comprador debe contratar seguro.", bestFor:"Cuando el comprador asiático prefiere su propio seguro", riskPoint:"Al abordo en origen (vendedor paga flete)", vendorPays:["Todo de FOB","+ Flete hasta puerto destino"], buyerPays:["Seguro (obligatorio para comprador)","THC destino","Aduana destino","Transporte destino"] },
  CIF: { name:"Cost, Insurance & Freight", emoji:"🔐", color:"#0369a1", vendorPct:57, tip:"El estándar para cartas de crédito. Vos pagás flete y seguro mínimo (ICC C).", bestFor:"Cartas de crédito, commodities, bancos internacionales", riskPoint:"Al abordo en origen (vendedor paga flete + seguro ICC C)", vendorPays:["Despacho exportación","Flete hasta puerto destino","Seguro básico ICC C","THC origen"], buyerPays:["THC destino","Aduana destino","Aranceles","Transporte destino"] },
  CIP: { name:"Carriage & Insurance Paid To", emoji:"🛡️", color:"#06b6d4", vendorPct:62, tip:"Como CIF pero para multimodal y con seguro ICC A (el más completo). Para manufcaturas de alto valor.", bestFor:"Maquinaria, farmacéuticos, manufactura de alto valor", riskPoint:"Al entregar al primer transportista en origen", vendorPays:["Despacho exportación","Flete hasta destino acordado","Seguro completo ICC A","THC origen"], buyerPays:["THC destino","Aduana destino","Aranceles","Transporte destino"] },
  DAP: { name:"Delivered At Place", emoji:"📍", color:"#10b981", vendorPct:78, tip:"Entregás casi puerta a puerta. El comprador solo paga la aduana local. Diferenciador premium.", bestFor:"Vinos, gourmet, marcas que quieren servicio premium", riskPoint:"En el lugar de destino acordado (antes de descarga)", vendorPays:["Todo hasta destino","Flete","Seguro","Transporte local destino"], buyerPays:["Descarga","Aduana destino","Aranceles"] },
  DDP: { name:"Delivered Duty Paid", emoji:"🎯", color:"#f59e0b", vendorPct:95, tip:"Máxima responsabilidad del exportador. Necesitás agente en destino. Muy atractivo para compradores sin exp.", bestFor:"E-commerce internacional, compradores sin experiencia importadora", riskPoint:"En destino final, listo para usar", vendorPays:["Absolutamente todo: aduana AR, flete, seguro, aduana destino, aranceles, entrega final"], buyerPays:["Solo recibe — ningún costo ni trámite"] },
};

// ─── PAÍSES ───────────────────────────────────────────────────────────────────
const COUNTRIES = [
  { code:"BR", label:"🇧🇷 Brasil",       dist:2924,  sea:7,  road:3, air:1 },
  { code:"CL", label:"🇨🇱 Chile",        dist:1100,  sea:0,  road:2, air:1 },
  { code:"UY", label:"🇺🇾 Uruguay",      dist:280,   sea:1,  road:1, air:1 },
  { code:"PY", label:"🇵🇾 Paraguay",     dist:1350,  sea:0,  road:2, air:1 },
  { code:"CN", label:"🇨🇳 China",        dist:19500, sea:35, road:0, air:2 },
  { code:"US", label:"🇺🇸 EE.UU.",       dist:11800, sea:22, road:0, air:2 },
  { code:"DE", label:"🇩🇪 Alemania",     dist:12200, sea:21, road:0, air:2 },
  { code:"NL", label:"🇳🇱 Países Bajos", dist:11900, sea:20, road:0, air:2 },
  { code:"ES", label:"🇪🇸 España",       dist:10400, sea:18, road:0, air:2 },
  { code:"MX", label:"🇲🇽 México",       dist:8900,  sea:18, road:0, air:2 },
  { code:"PE", label:"🇵🇪 Perú",         dist:3800,  sea:10, road:5, air:1 },
  { code:"IN", label:"🇮🇳 India",        dist:14200, sea:28, road:0, air:2 },
  { code:"ID", label:"🇮🇩 Indonesia",    dist:16800, sea:32, road:0, air:3 },
];

const DUTIES: Record<string, number> = { "12":33, "15":31, "23":31, "10":12, "02":9, "22":0, "08":5, "41":5, default:0 };
const TARIFFS: Record<string, Record<string, number>> = {
  BR:{default:0,"22":20}, CL:{default:0}, UY:{default:0}, PY:{default:0},
  CN:{default:9,"10":3,"12":3,"02":12}, US:{default:3.5,"02":4,"22":16},
  DE:{default:5,"10":0,"02":12,"22":32}, NL:{default:5,"02":12}, ES:{default:5,"02":12,"22":32},
  MX:{default:15,"10":10}, PE:{default:4,"10":0}, IN:{default:30,"10":50}, ID:{default:10},
};
const TREATIES: Record<string, string> = {
  BR:"MERCOSUR — 0%", CL:"ACE-35 — 0%", UY:"MERCOSUR — 0%", PY:"MERCOSUR — 0%",
  PE:"ACE-58", MX:"ACE-6", DE:"SGP Europeo", NL:"SGP Europeo", ES:"SGP Europeo",
  US:"SGP USA", CN:"NMF OMC", IN:"NMF OMC (alto)", ID:"NMF OMC",
};
const FREIGHT_BASE: Record<string, Record<string, number>> = {
  sea:{BR:180,UY:120,CN:1200,US:1100,DE:1050,NL:1000,ES:950,MX:900,PE:400,IN:1100,ID:1300,PY:150,default:800},
  road:{BR:280,CL:220,UY:150,PY:200,PE:600,default:300},
  air:{default:0},
};

// ─── LÓGICA DE CÁLCULO ────────────────────────────────────────────────────────
function calcBase(dest:string, kg:number, m3:number, fob:number, ch2:string, mode:"sea"|"road"|"air") {
  const ctry = COUNTRIES.find(c => c.code === dest)!;
  const distKm = ctry?.dist || 8000;
  const transit = (mode==="sea" ? ctry?.sea : mode==="road" ? ctry?.road : ctry?.air) || 20;
  const tons = kg / 1000;
  let freight = 0;
  if (mode==="air") { freight = Math.max(Math.max(kg, m3*167)*distKm*0.00028, 500); }
  else { const base = FREIGHT_BASE[mode]?.[dest] ?? FREIGHT_BASE[mode]?.["default"] ?? 800; freight = Math.max(base*tons + base*0.008*distKm*tons*0.1, base*0.5); }
  const ins = fob * 0.005;
  const dutyRate = DUTIES[ch2] ?? DUTIES["default"] ?? 0;
  const isFood = /^(0[1-9]|1[0-9]|2[0-3])$/.test(ch2);
  const ar = { derechoExportacion:Math.round(fob*dutyRate/100), despachoAduanero:350, certificadoOrigen:80, verificacionSENASA:isFood?120:0, gastosBancarios:150, THC_origen:mode!=="road"?200:0, precintado:50 };
  const totalAr = Object.values(ar).reduce((a,b) => a+b, 0);
  const cif = fob + freight + ins;
  const tariffR = TARIFFS[dest]?.[ch2] ?? TARIFFS[dest]?.["default"] ?? 10;
  const dst = { derechoImportacion:Math.round(cif*tariffR/100), THC_destino:mode!=="road"?250:0, despachoImportacion:400, almacenaje:Math.round(transit*15) };
  const totalDst = Object.values(dst).reduce((a,b) => a+b, 0);
  return { fob:Math.round(fob), freight:Math.round(freight), ins:Math.round(ins), cif:Math.round(cif), ar, totalAr:Math.round(totalAr), dutyRate, dst, totalDst:Math.round(totalDst), tariffR, landed:Math.round(fob+freight+ins+totalAr+totalDst), distKm, transit, treaty:TREATIES[dest]||"NMF", alert:dutyRate>20?`⚠️ Retención ${dutyRate}% sobre FOB`:null };
}

function vendorCostForInco(code: string, c: ReturnType<typeof calcBase>) {
  const extraDest = c.dst.THC_destino + c.dst.almacenaje;
  switch(code) {
    case "EXW": return Math.round(c.ar.precintado + 50);
    case "FCA": return Math.round(c.ar.derechoExportacion + c.ar.despachoAduanero + c.ar.certificadoOrigen + c.ar.verificacionSENASA + c.ar.gastosBancarios + 150);
    case "FAS": return Math.round(c.totalAr - c.ar.THC_origen + c.ar.THC_origen*0.5);
    case "FOB": return Math.round(c.totalAr);
    case "CFR": case "CPT": return Math.round(c.totalAr + c.freight);
    case "CIF": case "CIP": return Math.round(c.totalAr + c.freight + c.ins);
    case "DAP": return Math.round(c.totalAr + c.freight + c.ins + extraDest);
    case "DPU": return Math.round(c.totalAr + c.freight + c.ins + extraDest + 300);
    case "DDP": return Math.round(c.totalAr + c.freight + c.ins + c.totalDst + 500);
    default: return Math.round(c.totalAr);
  }
}

// ─── MOTOR DE RECOMENDACIÓN INTELIGENTE ───────────────────────────────────────
function getSmartRecommendation(dest: string, ch: string, mode: string) {
  const ch2 = ch.padStart(2,"0").substring(0,2);
  const isMercosur = ["BR","UY","PY"].includes(dest);
  const isEurope   = ["DE","ES","NL","IT","FR"].includes(dest);
  const isAsia     = ["CN","IN","ID"].includes(dest);
  const isUS       = dest === "US";
  const isChile    = dest === "CL";

  // Granos / Cereales
  if (["10","12"].includes(ch2)) {
    if (isMercosur) return { main:"FOB", alts:["FCA","CFR","FAS"], reason:"Para granos a MERCOSUR, FOB es el estándar de la industria granaria argentina.", detail:"Cargás en el buque en Rosario o Buenos Aires. El comprador paga el barco y el seguro.", badge:"ESTÁNDAR GRANARIO" };
    if (isAsia)     return { main:"CFR", alts:["FOB","CIF","FAS"], reason:"Los compradores asiáticos de granos prefieren CFR para contratar su propio seguro.", detail:"Pagás el flete hasta destino. El ahorro en seguro es para ellos.", badge:"PREFERIDO ASIA" };
    return              { main:"FOB", alts:["CFR","CIF","FCA"], reason:"FOB es el punto de partida internacional para commodities.", detail:"El comprador controla el flete. Vos manejás solo la exportación argentina.", badge:"RECOMENDADO" };
  }
  // Carne / Proteínas animales
  if (ch2 === "02") {
    if (isMercosur) return { main:"CIF", alts:["FOB","CFR","DAP"], reason:"Para carne a Brasil y MERCOSUR, CIF es el estándar con flete frigorífico.", detail:"Incluís el flete refrigerado y seguro básico. El comprador solo despacha en destino.", badge:"ESTÁNDAR CÁRNICO" };
    if (isAsia)     return { main:"CFR", alts:["CIF","FOB","DAP"], reason:"China e Indonesia prefieren CFR para proteínas: controlan el seguro de la carga.", detail:"Protegé la cadena de frío con seguro adicional voluntario ICC A.", badge:"RECOMENDADO ASIA" };
    return              { main:"CIF", alts:["FOB","CFR","DAP"], reason:"CIF cubre flete y seguro mínimo. Estándar para alimentos refrigerados.", detail:"Si el producto tiene alto valor, considerá CIP con cobertura ICC A.", badge:"ESTÁNDAR" };
  }
  // Vinos / Bebidas
  if (ch2 === "22") {
    if (isEurope) return { main:"DAP", alts:["CIP","CIF","FOB"], reason:"Para vino argentino a Europa, DAP te diferencia: entregás casi puerta a puerta.", detail:"El importador solo paga la aduana europea. Vos controlás la cadena de frío y llegada perfecta.", badge:"DIFERENCIADOR PREMIUM" };
    return              { main:"CIF", alts:["DAP","FOB","CIP"], reason:"CIF cubre el viaje completo con seguro para bebidas de vidrio.", detail:"Si ya tenés buenos márgenes, saltar a DAP puede abrir nuevos compradores.", badge:"RECOMENDADO" };
  }
  // Manufacturas / Maquinaria
  if (["84","85","87"].includes(ch2)) {
    if (isEurope || isUS) return { main:"CIP", alts:["CIF","DAP","FOB"], reason:"Para maquinaria a mercados de alto valor, CIP es obligatorio: seguro ICC A total.", detail:"Tu equipo viaja con la cobertura máxima. El importador europeo/americano solo despacha.", badge:"IDEAL MANUFACTURA" };
    return                     { main:"CIF", alts:["CIP","DAP","FOB"], reason:"CIF protege tu envío de maquinaria con flete y seguro incluido.", detail:"Si querés diferenciarte, ofrecé DAP para que el comprador no tenga que gestionar nada.", badge:"RECOMENDADO" };
  }
  // Frutas / Hortalizas
  if (["07","08","09"].includes(ch2)) {
    if (isChile || isMercosur) return { main:"FCA", alts:["DAP","FOB","CFR"], reason:"Para frutas a vecinos por tierra, FCA es lo más limpio y flexible.", detail:"Entregás en el depósito del transportista. El comprador organiza el resto.", badge:"IDEAL TERRESTRE" };
    return { main:"CIF", alts:["DAP","FCA","FOB"], reason:"Para perecederos de larga distancia, CIF cubre el viaje completo.", detail:"Considerá DAP si querés ofrecer entrega directa al centro de distribución.", badge:"RECOMENDADO" };
  }
  // Textiles / Calzado
  if (["61","62","64"].includes(ch2)) {
    return { main:"FOB", alts:["CIF","FCA","DAP"], reason:"Para textiles y calzado, FOB es el estándar mundial de la industria.", detail:"El comprador generalmente trabaja con su propio freight forwarder.", badge:"ESTÁNDAR MODA" };
  }
  // Default PyME que empieza
  return { main:"FCA", alts:["FOB","CIF","DAP"], reason:"FCA es el incoterm más moderno y flexible. Perfecto para PyMEs que empiezan a exportar.", detail:"Entregás al transportista y el riesgo pasa al comprador. Mucho más simple que FOB.", badge:"IDEAL PARA EMPEZAR" };
}

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

// ─── ESTILOS GLOBALES ─────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600;700;800&display=swap');
.tc2{font-family:'Inter',sans-serif;--bg:#07111d;--sf:#0d1f33;--sf2:#0a1a2e;--bd:#1a3a5a;--bd2:#203a55;--ac:#00d4ff;--wn:#f59e0b;--ok:#22c55e;--err:#ef4444;--tx:#ffffff;--mu:#7aa4c4;--mu2:#4a7090}
.tc2 *{box-sizing:border-box}
.tc2 input,.tc2 select{font-family:'JetBrains Mono',monospace}
.tc2 input:focus,.tc2 select:focus{border-color:var(--ac)!important;outline:none;box-shadow:0 0 0 2px rgba(0,212,255,.12)}
.tc2-btn{transition:all .15s;cursor:pointer}.tc2-btn:hover{opacity:.85;transform:translateY(-1px)}.tc2-btn:active{transform:none}
.tc2-alt-card{transition:all .2s;cursor:pointer}.tc2-alt-card:hover{transform:translateY(-2px);border-color:var(--bd2)!important}
.tc2-alt-card.selected{box-shadow:0 0 0 2px rgba(0,212,255,.35)!important}
.tc2-fd{animation:tc2fd .35s ease}@keyframes tc2fd{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.tc2-spin{animation:tc2sp .9s linear infinite}@keyframes tc2sp{to{transform:rotate(360deg)}}
.tc2-pulse{animation:tc2pl 1.4s ease-in-out infinite}@keyframes tc2pl{0%,100%{opacity:1}50%{opacity:.45}}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#05111d}::-webkit-scrollbar-thumb{background:#1a3a5a;border-radius:3px}
`;

interface Props { defaultDestination?:string; defaultProduct?:string; defaultHsCode?:string; originCountry?:string; onClose?:()=>void; }

export default function TradeCalculator({ defaultDestination="BR", defaultProduct="", defaultHsCode="1001.99.00", originCountry: propOrigin, onClose }: Props) {
  // TradeContext is the Single Source of Truth for origin country
  const trade = useTrade();
  const originCountry = propOrigin || trade.originCountry || 'AR';
  const [dest, setDest] = useState(defaultDestination);
  const [mode, setMode] = useState<"sea"|"road"|"air">("sea");
  const [kg, setKg] = useState("1000");
  const [m3, setM3] = useState("3");
  const [fob, setFob] = useState("50000");
  const [ch, setCh] = useState(defaultHsCode.substring(0,2) || "10");
  const [prodCost, setProdCost] = useState("30000");
  const [price, setPrice] = useState("55");
  const [qty, setQty] = useState("1000");
  const [result, setResult] = useState<ReturnType<typeof calcBase>|null>(null);
  const [loading, setLoading] = useState(false);
  const [selAlt, setSelAlt] = useState<string|null>(null);
  const [showProfit, setShowProfit] = useState(false);
  const [expandedInco, setExpandedInco] = useState<string|null>(null);

  const calculate = async () => {
    setLoading(true);
    setResult(null);
    setSelAlt(null);
    setShowProfit(false);
    setExpandedInco(null);
    await new Promise(r => setTimeout(r, 350));
    try {
      const ch2 = ch.padStart(2,"0").substring(0,2);
      let data: ReturnType<typeof calcBase>|null = null;
      try {
        const p = new URLSearchParams({ origin:originCountry, destination:dest, weightKg:kg, volumeM3:m3, fobValueUSD:fob, hsChapter:ch2, mode });
        const res = await fetch(`/api/logistics/calculate?${p}`);
        if (res.ok) {
          const d = await res.json();
          data = { fob:d.costs.fobValue, freight:d.costs.freight, ins:d.costs.insurance, cif:d.costs.cifValue, ar:d.costs.arExportCosts, totalAr:d.costs.totalArExport, dutyRate:d.costs.exportDutyRate, dst:d.costs.destCosts, totalDst:d.costs.totalDestCosts, tariffR:d.costs.tariffRate, landed:d.costs.totalLandedCost, distKm:d.route.distanceKm, transit:d.route.transitDays, treaty:d.summary.tariffTreaty, alert:d.summary.alert };
        }
      } catch {}
      setResult(data || calcBase(dest, +kg, +m3, +fob, ch2, mode));
    } finally { setLoading(false); }
  };

  const iS = { width:"100%", padding:"10px 14px", background:"var(--sf2)", border:"1px solid var(--bd)", borderRadius:"8px", color:"var(--tx)", fontSize:"14px" } as const;
  const lS = { fontSize:"10px", color:"var(--mu)", letterSpacing:".9px", textTransform:"uppercase" as const, marginBottom:"6px", fontWeight:600, display:"block" };

  const c = result;
  const rec = c ? getSmartRecommendation(dest, ch, mode) : null;
  const activeInco = selAlt ?? rec?.main ?? "FOB";
  const incoData = ALL_INCOTERMS[activeInco];
  const vendorCost = c ? vendorCostForInco(activeInco, c) : 0;
  const originLabel = COUNTRIES.find(x => x.code === originCountry)?.label || originCountry;
  const countryLabel = COUNTRIES.find(x => x.code === dest)?.label || dest;

  // Profit with active incoterm
  const profit = c ? (() => {
    const vc = vendorCostForInco(activeInco, c);
    const rev = +price * +qty, pc = +prodCost, gp = rev - pc - vc;
    return { rev:Math.round(rev), pc:Math.round(pc), vc:Math.round(vc), gp:Math.round(gp), margin:rev>0?((gp/rev)*100).toFixed(1):"0", roi:pc>0?((gp/pc)*100).toFixed(1):"0", be:(pc+vc)>0?Math.ceil((pc+vc)/(+price||1)):0, minPrice:Math.round((pc+vc)/(+qty||1)) };
  })() : null;

  const altsWithMain = rec ? [rec.main, ...rec.alts] : ["FOB","CIF","DAP","FCA"];

  return (
    <>
      <style>{CSS}</style>
      <div className="tc2" style={{ position:"fixed", inset:0, background:"rgba(0,5,14,.88)", backdropFilter:"blur(8px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"12px" }} onClick={e => e.target===e.currentTarget && onClose?.()}>
        <div style={{ background:"var(--bg)", border:"1px solid var(--bd)", borderRadius:"20px", width:"100%", maxWidth:"960px", maxHeight:"94vh", overflowY:"auto", boxShadow:"0 32px 96px rgba(0,0,0,.75)" }}>

          {/* ── HEADER ──────────────────────────────────────────────────────── */}
          <div style={{ padding:"22px 28px 20px", background:"linear-gradient(180deg, #0d2035 0%, var(--bg) 100%)", borderRadius:"20px 20px 0 0", borderBottom:"1px solid var(--bd)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"4px" }}>
                  <span style={{ fontSize:"20px" }}>⚡</span>
                  <h2 style={{ margin:0, fontSize:"18px", fontWeight:800, color:"#fff", letterSpacing:"-0.3px" }}>Trade Calculator</h2>
                  <span style={{ fontSize:"10px", background:"rgba(0,212,255,.1)", color:"var(--ac)", padding:"2px 8px", borderRadius:"20px", border:"1px solid rgba(0,212,255,.25)", fontWeight:600, letterSpacing:".6px" }}>CHE.COMEX</span>
                </div>
                <div style={{ fontSize:"12px", color:"var(--mu)" }}>
                  {originLabel} → {countryLabel}{defaultProduct ? ` · ${defaultProduct}` : ""} · Calculá tu Incoterm óptimo en segundos
                </div>
              </div>
              {onClose && <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--mu)", fontSize:"24px", cursor:"pointer", lineHeight:1, padding:"4px 8px" }}>×</button>}
            </div>
          </div>

          <div style={{ padding:"24px 28px" }}>

            {/* ── INPUTS ──────────────────────────────────────────────────────── */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:"12px", marginBottom:"16px" }}>
              <div><label style={lS}>Destino</label><select style={{...iS,cursor:"pointer"}} value={dest} onChange={e=>setDest(e.target.value)}>{COUNTRIES.map(x=><option key={x.code} value={x.code}>{x.label}</option>)}</select></div>
              <div><label style={lS}>Transporte</label><select style={{...iS,cursor:"pointer"}} value={mode} onChange={e=>setMode(e.target.value as any)}><option value="sea">🚢 Marítimo</option><option value="road">🚛 Terrestre</option><option value="air">✈️ Aéreo</option></select></div>
              <div><label style={lS}>Capítulo HS</label><input style={iS} type="text" maxLength={2} value={ch} onChange={e=>setCh(e.target.value)} placeholder="10"/></div>
              <div><label style={lS}>Peso (kg)</label><input style={iS} type="number" value={kg} onChange={e=>setKg(e.target.value)}/></div>
              <div><label style={lS}>Volumen (m³)</label><input style={iS} type="number" value={m3} onChange={e=>setM3(e.target.value)}/></div>
              <div><label style={lS}>FOB (USD)</label><input style={iS} type="number" value={fob} onChange={e=>setFob(e.target.value)}/></div>
            </div>

            {/* ── BOTÓN CALCULAR ─────────────────────────────────────────────── */}
            <button className="tc2-btn" onClick={calculate} disabled={loading} style={{ width:"100%", padding:"14px", borderRadius:"10px", border:"none", background:loading?"var(--bd)":"linear-gradient(135deg, #0050c0, #00c8f0)", color:"#fff", fontSize:"15px", fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:"'Inter',sans-serif", marginBottom:"28px", display:"flex", alignItems:"center", justifyContent:"center", gap:"10px" }}>
              {loading ? (<><div className="tc2-spin" style={{width:"16px",height:"16px",border:"2px solid #fff4",borderTop:"2px solid #fff",borderRadius:"50%"}}/><span className="tc2-pulse">Analizando tu operación...</span></>) : "⚡  Calcular Incoterm Óptimo"}
            </button>

            {/* ── RESULTADOS ─────────────────────────────────────────────────── */}
            {c && rec && (
              <div className="tc2-fd">

                {/* ALERT */}
                {c.alert && (
                  <div style={{ background:"rgba(245,158,11,.08)", border:"1px solid rgba(245,158,11,.3)", borderRadius:"8px", padding:"10px 14px", marginBottom:"20px", fontSize:"12px", color:"var(--wn)", display:"flex", gap:"8px", alignItems:"center" }}>
                    <span style={{fontSize:"16px"}}>⚠️</span><span>{c.alert} — verificá tu retención antes de cotizar.</span>
                  </div>
                )}

                {/* ── KPIs RÁPIDOS ──────────────────────────────────────────── */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"10px", marginBottom:"28px" }}>
                  {[
                    { l:"Landed Cost", v:fmt(c.landed), col:"var(--wn)", sub:"Costo total en destino" },
                    { l:"Flete + Seguro", v:fmt(c.freight+c.ins), col:"var(--ac)", sub:`${c.transit} días de tránsito` },
                    { l:"Tratado", v:c.treaty.split("—")[0].trim(), col:"#a78bfa", sub:c.treaty.includes("0%")?"Arancel 0%":`Arancel ${c.tariffR}%` },
                    { l:"Tu costo ("+activeInco+")", v:fmt(vendorCost), col:"var(--ok)", sub:"Costos del vendedor" },
                  ].map(({l,v,col,sub}) => (
                    <div key={l} style={{ background:"var(--sf)", border:"1px solid var(--bd)", borderRadius:"10px", padding:"14px 16px" }}>
                      <div style={{ fontSize:"10px", color:"var(--mu)", textTransform:"uppercase", letterSpacing:".7px", marginBottom:"6px" }}>{l}</div>
                      <div style={{ fontSize:"17px", fontWeight:800, color:col, fontFamily:"'JetBrains Mono',monospace", lineHeight:1.1, marginBottom:"4px" }}>{v}</div>
                      <div style={{ fontSize:"10px", color:"var(--mu2)" }}>{sub}</div>
                    </div>
                  ))}
                </div>

                {/* ── SECCIÓN 1: RECOMENDACIÓN PRINCIPAL ───────────────────── */}
                <div style={{ marginBottom:"8px", display:"flex", alignItems:"center", gap:"10px" }}>
                  <div style={{ height:"1px", flex:1, background:"var(--bd)" }}/>
                  <span style={{ fontSize:"10px", fontWeight:700, color:"var(--mu)", letterSpacing:"1px", textTransform:"uppercase" }}>① Recomendación Óptima para tu Operación</span>
                  <div style={{ height:"1px", flex:1, background:"var(--bd)" }}/>
                </div>

                <div style={{ background:"linear-gradient(135deg, #091a2d 0%, #071522 100%)", border:`2px solid ${ALL_INCOTERMS[rec.main].color}60`, borderRadius:"14px", padding:"22px 24px", marginBottom:"24px", position:"relative", overflow:"hidden" }}>
                  {/* Glow bg */}
                  <div style={{ position:"absolute", top:"-30px", right:"-30px", width:"180px", height:"180px", background:ALL_INCOTERMS[rec.main].color, opacity:.04, borderRadius:"50%", filter:"blur(40px)", pointerEvents:"none" }}/>

                  <div style={{ display:"flex", gap:"20px", alignItems:"flex-start", flexWrap:"wrap" }}>
                    {/* Incoterm hero badge */}
                    <div style={{ textAlign:"center", minWidth:"100px" }}>
                      <div style={{ fontSize:"36px", marginBottom:"4px" }}>{ALL_INCOTERMS[rec.main].emoji}</div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"32px", fontWeight:800, color:ALL_INCOTERMS[rec.main].color, lineHeight:1, letterSpacing:"-1px" }}>{rec.main}</div>
                      <div style={{ fontSize:"10px", color:"var(--mu)", marginTop:"4px", maxWidth:"100px", lineHeight:1.3 }}>{ALL_INCOTERMS[rec.main].name}</div>
                      <div style={{ marginTop:"8px", padding:"3px 8px", background:`${ALL_INCOTERMS[rec.main].color}18`, border:`1px solid ${ALL_INCOTERMS[rec.main].color}40`, borderRadius:"4px", fontSize:"9px", fontWeight:700, color:ALL_INCOTERMS[rec.main].color, letterSpacing:".6px" }}>{rec.badge}</div>
                    </div>

                    {/* Reason + detail */}
                    <div style={{ flex:1, minWidth:"200px" }}>
                      <div style={{ fontSize:"15px", fontWeight:700, color:"#fff", marginBottom:"6px", lineHeight:1.4 }}>{rec.reason}</div>
                      <div style={{ fontSize:"13px", color:"var(--mu)", lineHeight:1.55, marginBottom:"14px" }}>{rec.detail}</div>

                      {/* Risk bar */}
                      <div style={{ marginBottom:"12px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"10px", color:"var(--mu2)", marginBottom:"5px" }}>
                          <span>🏭 Tu costo (vendedor)</span><span>🏢 Costo comprador</span>
                        </div>
                        <div style={{ display:"flex", height:"8px", borderRadius:"4px", overflow:"hidden", background:"var(--bd)" }}>
                          <div style={{ width:`${ALL_INCOTERMS[rec.main].vendorPct}%`, background:`linear-gradient(90deg, ${ALL_INCOTERMS[rec.main].color}cc, ${ALL_INCOTERMS[rec.main].color})`, borderRadius:"4px 0 0 4px" }}/>
                          <div style={{ flex:1, background:"#1a3a5a" }}/>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", fontWeight:700, fontFamily:"'JetBrains Mono',monospace", marginTop:"4px" }}>
                          <span style={{ color:ALL_INCOTERMS[rec.main].color }}>{fmt(vendorCost)}</span>
                          <span style={{ color:"var(--mu)" }}>{fmt(c.landed - +fob - vendorCost + c.dst.derechoImportacion + c.dst.despachoImportacion)}</span>
                        </div>
                      </div>

                      {/* Risk transfer point */}
                      <div style={{ display:"flex", gap:"6px", alignItems:"flex-start", padding:"8px 12px", background:"rgba(0,212,255,.06)", border:"1px solid rgba(0,212,255,.15)", borderRadius:"6px" }}>
                        <span style={{ fontSize:"12px" }}>📍</span>
                        <div>
                          <div style={{ fontSize:"9px", color:"var(--ac)", fontWeight:700, letterSpacing:".6px", marginBottom:"2px" }}>TRANSFERENCIA DE RIESGO</div>
                          <div style={{ fontSize:"11px", color:"#c8dff0" }}>{ALL_INCOTERMS[rec.main].riskPoint}</div>
                        </div>
                      </div>
                    </div>

                    {/* Desglose rápido */}
                    <div style={{ minWidth:"190px", background:"var(--sf)", borderRadius:"10px", padding:"14px", border:"1px solid var(--bd)" }}>
                      <div style={{ fontSize:"10px", color:"var(--mu)", fontWeight:700, letterSpacing:".7px", marginBottom:"10px", textTransform:"uppercase" }}>Vos Pagás</div>
                      {ALL_INCOTERMS[rec.main].vendorPays.map(v => (
                        <div key={v} style={{ display:"flex", gap:"6px", alignItems:"flex-start", fontSize:"11px", color:"#c8dff0", marginBottom:"5px" }}>
                          <span style={{ color:ALL_INCOTERMS[rec.main].color, flexShrink:0 }}>✓</span>{v}
                        </div>
                      ))}
                      <div style={{ borderTop:"1px solid var(--bd)", marginTop:"10px", paddingTop:"10px" }}>
                        <div style={{ fontSize:"10px", color:"var(--mu)", fontWeight:700, letterSpacing:".7px", marginBottom:"8px", textTransform:"uppercase" }}>Comprador Paga</div>
                        {ALL_INCOTERMS[rec.main].buyerPays.map(v => (
                          <div key={v} style={{ display:"flex", gap:"6px", alignItems:"flex-start", fontSize:"11px", color:"var(--mu2)", marginBottom:"5px" }}>
                            <span style={{ color:"var(--mu2)", flexShrink:0 }}>○</span>{v}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── SECCIÓN 2: ALTERNATIVAS ───────────────────────────────── */}
                <div style={{ marginBottom:"8px", display:"flex", alignItems:"center", gap:"10px" }}>
                  <div style={{ height:"1px", flex:1, background:"var(--bd)" }}/>
                  <span style={{ fontSize:"10px", fontWeight:700, color:"var(--mu)", letterSpacing:"1px", textTransform:"uppercase" }}>② Compará 3 Alternativas Relevantes</span>
                  <div style={{ height:"1px", flex:1, background:"var(--bd)" }}/>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"28px" }}>
                  {rec.alts.map((code, idx) => {
                    const inc = ALL_INCOTERMS[code];
                    if (!inc) return null;
                    const vc = vendorCostForInco(code, c);
                    const isSelected = selAlt === code;
                    const isExpanded = expandedInco === code;
                    return (
                      <div key={code}
                        className={`tc2-alt-card ${isSelected?"selected":""}`}
                        style={{ background:"var(--sf)", border:`1.5px solid ${isSelected ? inc.color : "var(--bd)"}`, borderRadius:"10px", padding:"14px", cursor:"pointer", position:"relative" }}
                        onClick={() => { setSelAlt(isSelected?null:code); setExpandedInco(isExpanded?null:code); }}
                      >
                        {isSelected && <div style={{ position:"absolute", top:"10px", right:"10px", fontSize:"9px", fontWeight:700, background:`${inc.color}22`, color:inc.color, padding:"2px 7px", border:`1px solid ${inc.color}50`, borderRadius:"3px" }}>ACTIVO</div>}
                        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px" }}>
                          <span style={{ fontSize:"20px" }}>{inc.emoji}</span>
                          <div>
                            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"18px", fontWeight:800, color:inc.color, lineHeight:1 }}>{code}</div>
                            <div style={{ fontSize:"10px", color:"var(--mu)", lineHeight:1.2 }}>{inc.name}</div>
                          </div>
                        </div>

                        {/* Barra comparativa */}
                        <div style={{ marginBottom:"8px" }}>
                          <div style={{ height:"5px", borderRadius:"3px", overflow:"hidden", background:"var(--bd)", marginBottom:"4px" }}>
                            <div style={{ height:"100%", width:`${inc.vendorPct}%`, background:inc.color, borderRadius:"3px" }}/>
                          </div>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"10px" }}>
                            <span style={{ color:inc.color, fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(vc)}</span>
                            <span style={{ color:"var(--mu2)" }}>tu costo</span>
                          </div>
                        </div>

                        <div style={{ fontSize:"11px", color:"var(--mu)", lineHeight:1.4, marginBottom:"8px" }}>{inc.bestFor}</div>

                        {/* Vs recomendado */}
                        {(() => {
                          const mainVc = vendorCostForInco(rec.main, c);
                          const diff = vc - mainVc;
                          const label = diff > 0 ? `+${fmt(diff)} más caro` : diff < 0 ? `${fmt(diff)} más barato` : "Mismo costo";
                          const col = diff > 200 ? "#ef4444" : diff < -200 ? "var(--ok)" : "var(--mu)";
                          return <div style={{ fontSize:"10px", color:col, fontWeight:600, fontFamily:"'JetBrains Mono',monospace" }}>vs {rec.main}: {label}</div>;
                        })()}

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div style={{ marginTop:"12px", paddingTop:"12px", borderTop:"1px solid var(--bd)", animation:"tc2fd .2s ease" }}>
                            <div style={{ fontSize:"10px", color:inc.color, fontWeight:700, marginBottom:"6px", textTransform:"uppercase", letterSpacing:".6px" }}>Vos pagás:</div>
                            {inc.vendorPays.slice(0,3).map(v => <div key={v} style={{ fontSize:"10px", color:"#c8dff0", marginBottom:"3px", display:"flex", gap:"5px" }}><span style={{color:inc.color}}>✓</span>{v}</div>)}
                            <div style={{ fontSize:"10px", color:"var(--mu)", marginTop:"6px", letterSpacing:".5px" }}>💡 {inc.tip}</div>
                          </div>
                        )}

                        <div style={{ textAlign:"center", marginTop:"8px", fontSize:"10px", color:"var(--mu2)" }}>
                          {isExpanded ? "▲ menos" : "▼ ver detalle"}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── SECCIÓN 3: RENTABILIDAD SIMPLE ────────────────────────── */}
                <div style={{ marginBottom:"8px", display:"flex", alignItems:"center", gap:"10px" }}>
                  <div style={{ height:"1px", flex:1, background:"var(--bd)" }}/>
                  <span style={{ fontSize:"10px", fontWeight:700, color:"var(--mu)", letterSpacing:"1px", textTransform:"uppercase" }}>③ ¿Te deja ganancia?</span>
                  <div style={{ height:"1px", flex:1, background:"var(--bd)" }}/>
                </div>

                {!showProfit ? (
                  <div style={{ background:"var(--sf)", border:"1px solid var(--bd)", borderRadius:"12px", padding:"18px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"12px" }}>
                    <div>
                      <div style={{ fontSize:"14px", fontWeight:700, color:"#fff", marginBottom:"4px" }}>Calculá tu rentabilidad con <span style={{ color:incoData?.color }}>{activeInco}</span></div>
                      <div style={{ fontSize:"12px", color:"var(--mu)" }}>Ingresá tu costo de producción, precio de venta y cantidad para ver margen, ROI y punto de equilibrio.</div>
                    </div>
                    <button className="tc2-btn" onClick={()=>setShowProfit(true)} style={{ padding:"10px 20px", background:"linear-gradient(135deg,#0050c0,#00c8f0)", border:"none", borderRadius:"8px", color:"#fff", fontSize:"13px", fontWeight:700, fontFamily:"'Inter',sans-serif", cursor:"pointer", whiteSpace:"nowrap" }}>
                      📈 Ver Rentabilidad
                    </button>
                  </div>
                ) : (
                  <div className="tc2-fd">
                    {/* Inputs de rentabilidad */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px", marginBottom:"16px", padding:"16px", background:"var(--sf)", borderRadius:"10px", border:"1px solid var(--bd)" }}>
                      <div><label style={lS}>Costo producción total (USD)</label><input style={iS} type="number" value={prodCost} onChange={e=>setProdCost(e.target.value)}/></div>
                      <div><label style={lS}>Precio venta / unidad (USD)</label><input style={iS} type="number" value={price} onChange={e=>setPrice(e.target.value)}/></div>
                      <div><label style={lS}>Unidades a exportar</label><input style={iS} type="number" value={qty} onChange={e=>setQty(e.target.value)}/></div>
                    </div>

                    {profit && (
                      <>
                        {/* P&L visual */}
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"10px", marginBottom:"16px" }}>
                          {[
                            { l:"Ingreso Total", v:fmt(profit.rev), col:"var(--ok)", sub:`${qty} u × $${price}` },
                            { l:"Margen Bruto", v:`${profit.margin}%`, col:+profit.margin>20?"var(--ok)":+profit.margin>5?"var(--wn)":"var(--err)", sub:+profit.margin>20?"Excelente":+profit.margin>5?"Aceptable":"Revisar precio" },
                            { l:"Ganancia", v:fmt(profit.gp), col:profit.gp>0?"var(--ok)":"var(--err)", sub:profit.gp>0?"✅ Rentable":"❌ En pérdida" },
                            { l:"Punto Equilibrio", v:`${profit.be.toLocaleString()} u`, col:"var(--ac)", sub:`Precio mín: ${fmt(profit.minPrice)}/u` },
                          ].map(({l,v,col,sub}) => (
                            <div key={l} style={{ background:"var(--sf)", border:`1px solid ${col}30`, borderRadius:"10px", padding:"14px" }}>
                              <div style={{ fontSize:"10px", color:"var(--mu)", textTransform:"uppercase", letterSpacing:".6px", marginBottom:"6px" }}>{l}</div>
                              <div style={{ fontSize:"19px", fontWeight:800, color:col, fontFamily:"'JetBrains Mono',monospace", lineHeight:1.1, marginBottom:"4px" }}>{v}</div>
                              <div style={{ fontSize:"10px", color:"var(--mu2)" }}>{sub}</div>
                            </div>
                          ))}
                        </div>

                        {/* Visual P&L bar */}
                        <div style={{ background:"var(--sf)", border:"1px solid var(--bd)", borderRadius:"10px", padding:"18px 20px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", color:"var(--mu)", marginBottom:"8px" }}>
                            <span>Estructura del Ingreso — Incoterm <strong style={{color:incoData?.color}}>{activeInco}</strong></span>
                            <span style={{ fontFamily:"'JetBrains Mono',monospace" }}>{fmt(profit.rev)}</span>
                          </div>
                          <div style={{ display:"flex", height:"28px", borderRadius:"6px", overflow:"hidden", marginBottom:"8px" }}>
                            <div title={`Producción: ${fmt(profit.pc)}`} style={{ width:`${(profit.pc/profit.rev*100)||0}%`, background:"#334155", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9px", color:"#94a3b8", whiteSpace:"nowrap", overflow:"hidden", padding:"0 4px" }}>Producción</div>
                            <div title={`${activeInco}: ${fmt(profit.vc)}`} style={{ width:`${(profit.vc/profit.rev*100)||0}%`, background:`${incoData?.color}66`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9px", color:"#fff", whiteSpace:"nowrap", overflow:"hidden", padding:"0 4px" }}>{activeInco}</div>
                            <div title={`Ganancia: ${fmt(profit.gp)}`} style={{ flex:1, background:profit.gp>0?"rgba(34,197,94,.35)":"rgba(239,68,68,.35)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9px", fontWeight:700, color:profit.gp>0?"var(--ok)":"var(--err)" }}>
                              {profit.gp>0?"Ganancia":"Pérdida"}
                            </div>
                          </div>
                          <div style={{ display:"flex", gap:"16px", flexWrap:"wrap" }}>
                            {[
                              { label:"Producción", v:profit.pc, col:"#94a3b8" },
                              { label:`Costos ${activeInco}`, v:profit.vc, col:incoData?.color||"var(--ac)" },
                              { label:"Ganancia Bruta", v:profit.gp, col:profit.gp>0?"var(--ok)":"var(--err)" },
                            ].map(({label,v,col}) => (
                              <div key={label} style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                                <div style={{ width:"10px", height:"10px", borderRadius:"2px", background:col, flexShrink:0 }}/>
                                <span style={{ fontSize:"11px", color:"var(--mu)" }}>{label}: <strong style={{ color:col, fontFamily:"'JetBrains Mono',monospace" }}>{v>=0?fmt(v):`-${fmt(Math.abs(v))}`}</strong></span>
                              </div>
                            ))}
                          </div>

                          {/* Consejo final */}
                          <div style={{ marginTop:"14px", padding:"12px 14px", background:profit.gp>0?"rgba(34,197,94,.06)":"rgba(239,68,68,.06)", border:`1px solid ${profit.gp>0?"rgba(34,197,94,.2)":"rgba(239,68,68,.2)"}`, borderRadius:"8px", fontSize:"12px", color:profit.gp>0?"var(--ok)":"var(--err)", lineHeight:1.55 }}>
                            {profit.gp>0
                              ? `✅ Rentable con ${activeInco}. Necesitás ${profit.be.toLocaleString()} unidades para el equilibrio. Ganás ${fmt(+price-profit.minPrice)}/u sobre el mínimo. ROI: ${profit.roi}%.`
                              : `❌ Con ${activeInco} no cubrís costos. Precio mínimo rentable: ${fmt(profit.minPrice)}/u (actual: ${fmt(+price)}/u). Probá con un Incoterm donde el comprador asuma más gastos (ej: FOB o FCA).`
                            }
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Footer tip */}
                <div style={{ marginTop:"20px", padding:"10px 14px", background:"rgba(0,212,255,.04)", border:"1px solid rgba(0,212,255,.1)", borderRadius:"8px", fontSize:"11px", color:"var(--mu)", display:"flex", gap:"8px", alignItems:"center" }}>
                  <span>💡</span>
                  <span>Seleccioná una alternativa arriba para comparar su rentabilidad. Podés cambiar el Incoterm activo en cualquier momento y la rentabilidad se recalcula al instante.</span>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
