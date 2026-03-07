// ============================================================
// ARCHIVO: src/components/TradeCalculator.tsx
// Herramienta unificada: Logística + Costos + Rentabilidad
// Reemplaza: LogisticsSimulator.tsx + CostCalculator.tsx
// ============================================================

import { useState, useEffect } from "react";

// ─── DATOS LOCALES (fallback si backend no responde) ──────────────────────────
const COUNTRIES = [
  { code: "BR", label: "🇧🇷 Brasil",          dist: 2924,  sea: 7,  road: 3,  air: 1 },
  { code: "CL", label: "🇨🇱 Chile",           dist: 1100,  sea: 0,  road: 2,  air: 1 },
  { code: "UY", label: "🇺🇾 Uruguay",         dist: 280,   sea: 1,  road: 1,  air: 1 },
  { code: "PY", label: "🇵🇾 Paraguay",        dist: 1350,  sea: 0,  road: 2,  air: 1 },
  { code: "CN", label: "🇨🇳 China",           dist: 19500, sea: 35, road: 0,  air: 2 },
  { code: "US", label: "🇺🇸 EE.UU.",          dist: 11800, sea: 22, road: 0,  air: 2 },
  { code: "DE", label: "🇩🇪 Alemania",        dist: 12200, sea: 21, road: 0,  air: 2 },
  { code: "NL", label: "🇳🇱 Países Bajos",    dist: 11900, sea: 20, road: 0,  air: 2 },
  { code: "ES", label: "🇪🇸 España",          dist: 10400, sea: 18, road: 0,  air: 2 },
  { code: "MX", label: "🇲🇽 México",          dist: 8900,  sea: 18, road: 0,  air: 2 },
  { code: "PE", label: "🇵🇪 Perú",            dist: 3800,  sea: 10, road: 5,  air: 1 },
  { code: "IN", label: "🇮🇳 India",           dist: 14200, sea: 28, road: 0,  air: 2 },
  { code: "ID", label: "🇮🇩 Indonesia",       dist: 16800, sea: 32, road: 0,  air: 3 },
];

const EXPORT_DUTIES: Record<string, number> = {
  "12": 33, "15": 31, "23": 31, "10": 12, "02": 9,
  "22": 0,  "08": 5,  "41": 5,  "28": 0,  "87": 0, default: 0,
};

const TARIFFS: Record<string, Record<string, number>> = {
  BR: { default: 0,  "22": 20 },
  CL: { default: 0 },
  UY: { default: 0 },
  PY: { default: 0 },
  CN: { default: 9,  "10": 3,  "12": 3, "02": 12, "22": 14 },
  US: { default: 3.5,"10": 2.8,"02": 4, "22": 16 },
  DE: { default: 5,  "10": 0,  "12": 0, "02": 12, "22": 32 },
  NL: { default: 5,  "10": 0,  "12": 0, "02": 12 },
  ES: { default: 5,  "10": 0,  "02": 12,"22": 32 },
  MX: { default: 15, "10": 10, "02": 20 },
  PE: { default: 4,  "10": 0,  "02": 0 },
  IN: { default: 30, "10": 50, "15": 100 },
  ID: { default: 10, "10": 5 },
};

const TREATIES: Record<string, string> = {
  BR: "MERCOSUR — 0% intrazona", CL: "ACE-35 — Libre comercio",
  UY: "MERCOSUR — 0% intrazona", PY: "MERCOSUR — 0% intrazona",
  PE: "ACE-58 — Desgravación prog.", MX: "ACE-6 — Preferencias sectoriales",
  DE: "SGP Europeo", NL: "SGP Europeo", ES: "SGP Europeo",
  US: "SGP USA — Form A requerido", CN: "NMF OMC — Sin TLC",
  IN: "NMF OMC — Arancel muy alto", ID: "NMF OMC",
};

const FREIGHT_BASE: Record<string, Record<string, number>> = {
  sea: { BR: 180, UY: 120, CN: 1200, US: 1100, DE: 1050, NL: 1000, ES: 950, MX: 900, PE: 400, IN: 1100, ID: 1300, PY: 150, default: 800 },
  road: { BR: 280, CL: 220, UY: 150, PY: 200, PE: 600, default: 300 },
  air: { default: 0 },
};

// ─── CÁLCULO LOCAL ────────────────────────────────────────────────────────────
function calcLocal(
  dest: string, weightKg: number, volumeM3: number,
  fob: number, chapter: string, mode: "sea" | "road" | "air",
  productionCost: number, pricePerUnit: number, units: number
) {
  const country = COUNTRIES.find(c => c.code === dest)!;
  const distKm = country?.dist || 8000;
  const transitDays = mode === "sea" ? country?.sea : mode === "road" ? country?.road : country?.air;
  const ch = chapter.padStart(2, "0").substring(0, 2);

  // Flete
  const tons = weightKg / 1000;
  let freight = 0;
  if (mode === "air") {
    const chargeable = Math.max(weightKg, volumeM3 * 167);
    freight = Math.max(chargeable * distKm * 0.00028, 500);
  } else {
    const base = (FREIGHT_BASE[mode]?.[dest] ?? FREIGHT_BASE[mode]?.["default"] ?? 800);
    freight = Math.max(base * tons + (base * 0.008) * distKm * tons * 0.1, base * 0.5);
  }

  const insurance = fob * 0.005;
  const exportDutyRate = EXPORT_DUTIES[ch] ?? EXPORT_DUTIES["default"] ?? 0;
  const exportDuty = fob * (exportDutyRate / 100);
  const isFoodChapter = /^(0[1-9]|1[0-9]|2[0-3])$/.test(ch);

  const arCosts = {
    derechoExportacion: Math.round(exportDuty),
    despachoAduanero: 350,
    certificadoOrigen: 80,
    verificacionSENASA: isFoodChapter ? 120 : 0,
    gastosBancarios: 150,
    THC_origen: mode !== "road" ? 200 : 0,
    precintado: 50,
  };
  const totalArExport = Object.values(arCosts).reduce((a, b) => a + b, 0);

  const cifValue = fob + freight + insurance;
  const tariffTable = TARIFFS[dest] || {};
  const tariffRate = tariffTable[ch] ?? tariffTable["default"] ?? 10;
  const importDuty = cifValue * (tariffRate / 100);
  const transitTime = transitDays || 20;
  const destCosts = {
    derechoImportacion: Math.round(importDuty),
    THC_destino: mode !== "road" ? 250 : 0,
    despachoImportacion: 400,
    almacenaje: Math.round(transitTime * 15),
  };
  const totalDestCosts = Object.values(destCosts).reduce((a, b) => a + b, 0);
  const landedCost = Math.round(fob + freight + insurance + totalArExport + totalDestCosts);

  // Rentabilidad
  const revenue = pricePerUnit * units;
  const totalProdCost = productionCost * units;
  const totalExportCost = totalArExport + Math.round(freight) + Math.round(insurance);
  const grossProfit = revenue - totalProdCost - totalExportCost;
  const grossMargin = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : "0";
  const breakeven = totalProdCost + totalExportCost > 0 ? Math.ceil((totalProdCost + totalExportCost) / (pricePerUnit || 1)) : 0;
  const roi = totalProdCost > 0 ? ((grossProfit / totalProdCost) * 100).toFixed(1) : "0";

  return {
    route: {
      distanceKm: distKm,
      mainPort: { origin: "Puerto Buenos Aires / Rosario", destination: `Puerto ${dest}` },
      notes: TREATIES[dest] || "",
      transitDays: transitTime,
      transportMode: mode,
    },
    costs: {
      fobValue: Math.round(fob),
      freight: Math.round(freight),
      insurance: Math.round(insurance),
      cifValue: Math.round(cifValue),
      arExportCosts: arCosts,
      totalArExport: Math.round(totalArExport),
      exportDutyRate,
      destCosts,
      totalDestCosts: Math.round(totalDestCosts),
      tariffRate,
      totalLandedCost: landedCost,
      marginEstimate: `${grossMargin}%`,
    },
    profitability: {
      revenue: Math.round(revenue),
      totalProdCost: Math.round(totalProdCost),
      totalExportCost: Math.round(totalExportCost),
      grossProfit: Math.round(grossProfit),
      grossMargin,
      roi,
      breakeven,
      netPriceNeeded: Math.round((totalProdCost + totalExportCost) / (units || 1)),
    },
    summary: {
      tariffTreaty: TREATIES[dest] || "NMF OMC",
      alert: exportDutyRate > 20 ? `⚠️ Retención ${exportDutyRate}% sobre FOB` : null,
    },
    incoterms: {
      FOB: {
        vendedorPaga: {
          label: "FOB", total: Math.round(totalArExport),
          items: Object.entries(arCosts).filter(([, v]) => v > 0).map(([k, v]) => ({ concepto: k, valor: v })),
        },
        compradorPaga: {
          items: [
            { concepto: "Flete internacional", valor: Math.round(freight) },
            { concepto: "Seguro", valor: Math.round(insurance) },
            { concepto: "Aranceles destino", valor: Math.round(importDuty) },
            { concepto: "Gastos destino", valor: Math.round(totalDestCosts - importDuty) },
          ],
          total: Math.round(freight + insurance + totalDestCosts),
        },
      },
      CIF: {
        vendedorPaga: {
          label: "CIF", total: Math.round(totalArExport + freight + insurance),
          items: [
            ...Object.entries(arCosts).filter(([, v]) => v > 0).map(([k, v]) => ({ concepto: k, valor: v })),
            { concepto: "Flete internacional", valor: Math.round(freight) },
            { concepto: "Seguro de carga", valor: Math.round(insurance) },
          ],
        },
        compradorPaga: {
          items: Object.entries(destCosts).filter(([, v]) => v > 0).map(([k, v]) => ({ concepto: k, valor: v })),
          total: Math.round(totalDestCosts),
        },
      },
    },
  };
}

// ─── HELPERS UI ───────────────────────────────────────────────────────────────
const fmt = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const pct = (n: string | number) => `${n}%`;

const COST_LABELS: Record<string, string> = {
  derechoExportacion: "Derecho de exportación",
  despachoAduanero: "Despacho aduanero (AR)",
  certificadoOrigen: "Certificado de origen",
  verificacionSENASA: "Verificación SENASA",
  gastosBancarios: "Gastos bancarios",
  THC_origen: "THC puerto origen",
  precintado: "Precintado",
  "Flete internacional": "Flete internacional",
  "Seguro": "Seguro de carga",
  "Seguro de carga": "Seguro de carga",
  "Aranceles destino": "Aranceles destino",
  "Gastos destino": "Gastos destino",
  derechoImportacion: "Arancel de importación",
  THC_destino: "THC puerto destino",
  despachoImportacion: "Despacho importación",
  almacenaje: "Almacenaje estimado",
};

// ─── ESTILOS BASE ─────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@400;600;700;800&display=swap');
  .tc-root { font-family: 'Syne', sans-serif; --c-bg: #07111d; --c-surface: #0d2035; --c-border: #1a3a5a; --c-accent: #00d4ff; --c-warn: #f59e0b; --c-ok: #22c55e; --c-text: #cce8ff; --c-muted: #5a8aaa; }
  .tc-root * { box-sizing: border-box; }
  .tc-tab { transition: all .2s; }
  .tc-tab:hover { opacity: .85; }
  .tc-input:focus { border-color: var(--c-accent) !important; outline: none; }
  .tc-btn-main { transition: opacity .15s, transform .1s; }
  .tc-btn-main:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
  .tc-btn-main:active:not(:disabled) { transform: translateY(0); }
  .tc-num { font-family: 'JetBrains Mono', monospace; }
  .fade-in { animation: fadeIn .35s ease; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
  .pulse { animation: pulse 1.5s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
`;

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
interface Props {
  defaultDestination?: string;
  defaultProduct?: string;
  defaultHsCode?: string;
  onClose?: () => void;
}

export default function TradeCalculator({ defaultDestination = "BR", defaultProduct = "", defaultHsCode = "1001.99.00", onClose }: Props) {
  const [tab, setTab] = useState<"logistics" | "costs" | "profit">("logistics");
  const [dest, setDest] = useState(defaultDestination);
  const [mode, setMode] = useState<"sea" | "road" | "air">("sea");
  const [weightKg, setWeightKg] = useState("1000");
  const [volumeM3, setVolumeM3] = useState("3");
  const [fobValue, setFobValue] = useState("50000");
  const [hsChapter, setHsChapter] = useState(defaultHsCode.substring(0, 2) || "10");
  const [incoterm, setIncoterm] = useState<"FOB" | "CIF">("CIF");
  // Rentabilidad
  const [productionCost, setProductionCost] = useState("30000");
  const [pricePerUnit, setPricePerUnit] = useState("55");
  const [units, setUnits] = useState("1000");
  const [result, setResult] = useState<ReturnType<typeof calcLocal> | null>(null);
  const [loading, setLoading] = useState(false);

  const countryLabel = COUNTRIES.find(c => c.code === dest)?.label || dest;

  const calculate = async () => {
    setLoading(true);
    try {
      // Intentar backend primero
      const params = new URLSearchParams({
        origin: "AR", destination: dest, weightKg, volumeM3,
        fobValueUSD: fobValue, hsChapter, mode,
      });
      let data: any = null;
      try {
        const res = await fetch(`/api/logistics/calculate?${params}`);
        if (res.ok) data = await res.json();
      } catch { /* usa cálculo local */ }

      if (data) {
        const u = +units, ppu = +pricePerUnit, pc = +productionCost;
        const revenue = ppu * u;
        const totalProdCost = pc * u;
        const totalExportCost = data.costs.totalArExport + data.costs.freight + data.costs.insurance;
        const grossProfit = revenue - totalProdCost - totalExportCost;
        const profitability = {
          revenue: Math.round(revenue),
          totalProdCost: Math.round(totalProdCost),
          totalExportCost: Math.round(totalExportCost),
          grossProfit: Math.round(grossProfit),
          grossMargin: revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : "0",
          roi: totalProdCost > 0 ? ((grossProfit / totalProdCost) * 100).toFixed(1) : "0",
          breakeven: totalProdCost + totalExportCost > 0 ? Math.ceil((totalProdCost + totalExportCost) / (ppu || 1)) : 0,
          netPriceNeeded: Math.round((totalProdCost + totalExportCost) / (u || 1)),
        };
        setResult({ ...data, profitability });
      } else {
        // Cálculo 100% local si backend no responde
        const r = calcLocal(dest, +weightKg, +volumeM3, +fobValue, hsChapter, mode, +productionCost, +pricePerUnit, +units);
        setResult(r);
      }
    } finally {
      setLoading(false);
    }
  };

  // Detectar modo disponible al cambiar destino
  useEffect(() => {
    const c = COUNTRIES.find(c => c.code === dest);
    if (!c) return;
    if (mode === "sea" && !c.sea) setMode(c.road ? "road" : "air");
    if (mode === "road" && !c.road) setMode(c.sea ? "sea" : "air");
  }, [dest]);

  const c = result?.costs;
  const p = result?.profitability;
  const inc = result?.incoterms?.[incoterm];

  const TAB_CFG = [
    { key: "logistics", label: "🚢 Logística", desc: "Rutas · Fletes · Incoterms" },
    { key: "costs",     label: "🧾 Costos",    desc: "Arancel · Aduana · Destino" },
    { key: "profit",    label: "📈 Rentabilidad", desc: "Margen · ROI · Punto de equilibrio" },
  ] as const;

  return (
    <>
      <style>{css}</style>
      <div className="tc-root" style={{
        position: "fixed", inset: 0, background: "rgba(0,5,12,.82)", backdropFilter: "blur(6px)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
      }} onClick={e => e.target === e.currentTarget && onClose?.()}>
        <div style={{
          background: "var(--c-bg)", border: "1px solid var(--c-border)", borderRadius: "18px",
          width: "100%", maxWidth: "960px", maxHeight: "92vh", overflowY: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(0,212,255,.08)",
        }}>
          {/* ── HEADER ── */}
          <div style={{
            padding: "20px 28px 0", background: "linear-gradient(180deg,#0d2035 0%,var(--c-bg) 100%)",
            borderRadius: "18px 18px 0 0",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "22px" }}>⚡</span>
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "var(--c-accent)", letterSpacing: "-0.5px" }}>
                    Trade Calculator
                  </h2>
                  <span style={{ fontSize: "11px", background: "#00d4ff22", color: "var(--c-accent)", padding: "2px 8px", borderRadius: "20px", border: "1px solid #00d4ff44", fontWeight: 600 }}>
                    Che.Comex
                  </span>
                </div>
                <div style={{ color: "var(--c-muted)", fontSize: "12px", marginTop: "4px" }}>
                  AR → {countryLabel} {defaultProduct ? `· ${defaultProduct}` : ""} · Logística + Costos + Rentabilidad unificados
                </div>
              </div>
              {onClose && (
                <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--c-muted)", fontSize: "22px", cursor: "pointer", lineHeight: 1, padding: "0 4px", borderRadius: "6px" }}>×</button>
              )}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "4px" }}>
              {TAB_CFG.map(t => (
                <button key={t.key} className="tc-tab" onClick={() => setTab(t.key)}
                  style={{
                    padding: "10px 20px", border: "none", borderRadius: "10px 10px 0 0", cursor: "pointer",
                    background: tab === t.key ? "var(--c-surface)" : "transparent",
                    borderBottom: tab === t.key ? "2px solid var(--c-accent)" : "2px solid transparent",
                    color: tab === t.key ? "var(--c-accent)" : "var(--c-muted)",
                    fontFamily: "inherit", fontWeight: tab === t.key ? 700 : 400, fontSize: "13px",
                  }}>
                  <div>{t.label}</div>
                  <div style={{ fontSize: "10px", opacity: .7, marginTop: "1px" }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── BODY ── */}
          <div style={{ padding: "24px 28px" }}>
            {/* INPUTS COMUNES */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "20px" }}>
              {[
                { label: "País destino", node: (
                  <select className="tc-input" value={dest} onChange={e => setDest(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "8px", color: "var(--c-text)", fontSize: "13px", cursor: "pointer" }}>
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                )},
                { label: "Transporte", node: (
                  <select className="tc-input" value={mode} onChange={e => setMode(e.target.value as any)}
                    style={{ width: "100%", padding: "10px 12px", background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "8px", color: "var(--c-text)", fontSize: "13px", cursor: "pointer" }}>
                    <option value="sea">🚢 Marítimo</option>
                    <option value="road">🚛 Terrestre</option>
                    <option value="air">✈️ Aéreo</option>
                  </select>
                )},
                { label: "Capítulo HS", node: (
                  <input className="tc-input" type="text" maxLength={2} value={hsChapter} onChange={e => setHsChapter(e.target.value)} placeholder="10"
                    style={{ width: "100%", padding: "10px 12px", background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "8px", color: "var(--c-text)", fontSize: "14px", fontFamily: "'JetBrains Mono',monospace" }} />
                )},
                { label: "Peso (kg)", node: (
                  <input className="tc-input" type="number" value={weightKg} onChange={e => setWeightKg(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "8px", color: "var(--c-text)", fontSize: "14px", fontFamily: "'JetBrains Mono',monospace" }} />
                )},
                { label: "Volumen (m³)", node: (
                  <input className="tc-input" type="number" value={volumeM3} onChange={e => setVolumeM3(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "8px", color: "var(--c-text)", fontSize: "14px", fontFamily: "'JetBrains Mono',monospace" }} />
                )},
                { label: "Valor FOB (USD)", node: (
                  <input className="tc-input" type="number" value={fobValue} onChange={e => setFobValue(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "8px", color: "var(--c-text)", fontSize: "14px", fontFamily: "'JetBrains Mono',monospace" }} />
                )},
              ].map(({ label, node }) => (
                <div key={label}>
                  <div style={{ fontSize: "10px", color: "var(--c-muted)", letterSpacing: ".8px", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>{label}</div>
                  {node}
                </div>
              ))}
            </div>

            {/* Inputs rentabilidad (solo en tab profit) */}
            {tab === "profit" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px", padding: "16px", background: "var(--c-surface)", borderRadius: "10px", border: "1px solid var(--c-border)" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--c-muted)", letterSpacing: ".8px", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>Costo producción (USD total)</div>
                  <input className="tc-input" type="number" value={productionCost} onChange={e => setProductionCost(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", background: "var(--c-bg)", border: "1px solid var(--c-border)", borderRadius: "8px", color: "var(--c-text)", fontSize: "14px", fontFamily: "'JetBrains Mono',monospace" }} />
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--c-muted)", letterSpacing: ".8px", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>Precio venta por unidad (USD)</div>
                  <input className="tc-input" type="number" value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", background: "var(--c-bg)", border: "1px solid var(--c-border)", borderRadius: "8px", color: "var(--c-text)", fontSize: "14px", fontFamily: "'JetBrains Mono',monospace" }} />
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--c-muted)", letterSpacing: ".8px", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>Unidades a exportar</div>
                  <input className="tc-input" type="number" value={units} onChange={e => setUnits(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", background: "var(--c-bg)", border: "1px solid var(--c-border)", borderRadius: "8px", color: "var(--c-text)", fontSize: "14px", fontFamily: "'JetBrains Mono',monospace" }} />
                </div>
              </div>
            )}

            {/* BOTÓN CALCULAR */}
            <button className="tc-btn-main" onClick={calculate} disabled={loading}
              style={{
                width: "100%", padding: "14px", borderRadius: "10px", border: "none",
                background: loading ? "var(--c-border)" : "linear-gradient(135deg,#0055cc,#00d4ff)",
                color: "#fff", fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit", letterSpacing: ".3px", marginBottom: "24px",
              }}>
              {loading ? <span className="pulse">Calculando...</span> : "⚡ Calcular todo"}
            </button>

            {/* ── RESULTADOS ── */}
            {result && c && (
              <div className="fade-in">
                {/* Alerta retención */}
                {result.summary.alert && (
                  <div style={{ background: "#1c1200", border: "1px solid var(--c-warn)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "var(--c-warn)" }}>
                    {result.summary.alert}
                  </div>
                )}

                {/* KPIs resumen siempre visibles */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "24px" }}>
                  {[
                    { label: "Landed Cost Total", val: fmt(c.totalLandedCost), color: "var(--c-warn)", icon: "📦" },
                    { label: "Valor CIF Destino", val: fmt(c.cifValue), color: "var(--c-accent)", icon: "🚢" },
                    { label: "Días de tránsito", val: `${result.route.transitDays} días`, color: "var(--c-ok)", icon: "⏱" },
                    { label: "Tratado aplicable", val: result.summary.tariffTreaty.split("—")[0].trim(), color: "#a78bfa", icon: "📜" },
                  ].map(({ label, val, color, icon }) => (
                    <div key={label} style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "10px", padding: "14px" }}>
                      <div style={{ fontSize: "18px", marginBottom: "6px" }}>{icon}</div>
                      <div style={{ fontSize: "10px", color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: "4px" }}>{label}</div>
                      <div className="tc-num" style={{ fontSize: "16px", fontWeight: 700, color }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* ── TAB: LOGÍSTICA ── */}
                {tab === "logistics" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    {/* Ruta */}
                    <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "12px", padding: "18px" }}>
                      <div style={{ fontSize: "11px", color: "var(--c-muted)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "14px", fontWeight: 600 }}>📍 Información de ruta</div>
                      {[
                        ["Distancia", `${result.route.distanceKm.toLocaleString()} km`],
                        ["Puerto origen", result.route.mainPort.origin],
                        ["Puerto destino", result.route.mainPort.destination],
                        ["Tiempo tránsito", `${result.route.transitDays} días (${result.route.transportMode})`],
                        ["Tratado", result.summary.tariffTreaty],
                        ["Arancel destino", `${c.tariffRate}% sobre CIF`],
                      ].map(([label, val]) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #122033", fontSize: "13px" }}>
                          <span style={{ color: "var(--c-muted)" }}>{label}</span>
                          <span style={{ fontWeight: 600, textAlign: "right", maxWidth: "55%" }}>{val}</span>
                        </div>
                      ))}
                      {result.route.notes && (
                        <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--c-muted)", fontStyle: "italic" }}>ℹ️ {result.route.notes}</div>
                      )}
                    </div>

                    {/* Incoterms */}
                    <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "12px", padding: "18px" }}>
                      <div style={{ fontSize: "11px", color: "var(--c-muted)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px", fontWeight: 600 }}>⚖️ Comparativa Incoterms</div>
                      <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
                        {(["FOB", "CIF"] as const).map(i => (
                          <button key={i} onClick={() => setIncoterm(i)}
                            style={{ padding: "6px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: "13px",
                              background: incoterm === i ? "linear-gradient(135deg,#0055cc,#00d4ff)" : "var(--c-bg)",
                              color: incoterm === i ? "#fff" : "var(--c-muted)",
                            }}>{i}</button>
                        ))}
                      </div>
                      {inc && (
                        <>
                          <div style={{ fontSize: "11px", color: "#0090ff", fontWeight: 600, marginBottom: "6px" }}>🏭 VENDEDOR paga</div>
                          {inc.vendedorPaga.items.filter(x => x.valor > 0).map((item, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "12px" }}>
                              <span style={{ color: "var(--c-muted)" }}>{COST_LABELS[item.concepto] || item.concepto}</span>
                              <span className="tc-num">{fmt(item.valor)}</span>
                            </div>
                          ))}
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 4px", fontWeight: 700, color: "#0090ff", borderTop: "1px solid var(--c-border)", marginTop: "4px" }}>
                            <span>Total vendedor</span><span className="tc-num">{fmt(inc.vendedorPaga.total)}</span>
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--c-warn)", fontWeight: 600, margin: "10px 0 6px" }}>🏪 COMPRADOR paga</div>
                          {inc.compradorPaga.items.filter(x => x.valor > 0).map((item, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "12px" }}>
                              <span style={{ color: "var(--c-muted)" }}>{COST_LABELS[item.concepto] || item.concepto}</span>
                              <span className="tc-num">{fmt(item.valor)}</span>
                            </div>
                          ))}
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", fontWeight: 700, color: "var(--c-warn)", borderTop: "1px solid var(--c-border)", marginTop: "4px" }}>
                            <span>Total comprador</span><span className="tc-num">{fmt(inc.compradorPaga.total)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* ── TAB: COSTOS ── */}
                {tab === "costs" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    {/* Costos AR */}
                    <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "12px", padding: "18px" }}>
                      <div style={{ fontSize: "11px", color: "var(--c-muted)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "14px", fontWeight: 600 }}>🇦🇷 Costos exportación Argentina</div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", borderBottom: "1px solid #122033" }}>
                        <span style={{ color: "var(--c-muted)" }}>Valor FOB declarado</span>
                        <span className="tc-num" style={{ fontWeight: 700 }}>{fmt(c.fobValue)}</span>
                      </div>
                      {Object.entries(c.arExportCosts).filter(([, v]) => v > 0).map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", borderBottom: "1px solid #122033" }}>
                          <span style={{ color: "var(--c-muted)" }}>{COST_LABELS[k] || k}</span>
                          <span className="tc-num">{fmt(v)}</span>
                        </div>
                      ))}
                      {c.exportDutyRate > 0 && (
                        <div style={{ background: "#1c1200", borderRadius: "6px", padding: "8px 10px", marginTop: "8px", fontSize: "12px", color: "var(--c-warn)" }}>
                          ⚠️ Retención del <strong>{c.exportDutyRate}%</strong> incluida en derecho de exportación
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontWeight: 700, color: "var(--c-accent)", borderTop: "1px solid var(--c-border)", marginTop: "6px", fontSize: "15px" }}>
                        <span>Subtotal AR</span><span className="tc-num">{fmt(c.totalArExport)}</span>
                      </div>
                    </div>

                    {/* Estructura de precio completa */}
                    <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "12px", padding: "18px" }}>
                      <div style={{ fontSize: "11px", color: "var(--c-muted)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "14px", fontWeight: 600 }}>📊 Estructura de precio completa</div>
                      {[
                        { label: "Valor FOB", val: c.fobValue, color: "var(--c-text)" },
                        { label: "Flete internacional", val: c.freight, color: "var(--c-text)" },
                        { label: "Seguro (0.5% FOB)", val: c.insurance, color: "var(--c-text)" },
                        { label: "Valor CIF en destino", val: c.cifValue, color: "var(--c-accent)", bold: true },
                        { label: `Arancel importación (${c.tariffRate}%)`, val: c.destCosts.derechoImportacion, color: "var(--c-text)" },
                        { label: "THC + despacho destino", val: (c.destCosts.THC_destino || 0) + (c.destCosts.despachoImportacion || 0), color: "var(--c-text)" },
                        { label: "Almacenaje estimado", val: c.destCosts.almacenaje || 0, color: "var(--c-text)" },
                        { label: "Costos exportación AR", val: c.totalArExport, color: "var(--c-text)" },
                      ].map(({ label, val, color, bold }) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", borderBottom: "1px solid #122033" }}>
                          <span style={{ color: "var(--c-muted)" }}>{label}</span>
                          <span className="tc-num" style={{ fontWeight: bold ? 700 : 500, color }}>{fmt(val)}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontWeight: 700, color: "var(--c-warn)", borderTop: "1px solid var(--c-border)", marginTop: "6px", fontSize: "16px" }}>
                        <span>LANDED COST TOTAL</span><span className="tc-num">{fmt(c.totalLandedCost)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB: RENTABILIDAD ── */}
                {tab === "profit" && p && (
                  <div>
                    {/* Indicadores principales */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "20px" }}>
                      {[
                        { label: "Ingreso total", val: fmt(p.revenue), color: "var(--c-ok)", icon: "💵", sub: `${units} unidades × $${pricePerUnit}` },
                        { label: "Ganancia bruta", val: fmt(p.grossProfit), color: p.grossProfit > 0 ? "var(--c-ok)" : "#ef4444", icon: p.grossProfit > 0 ? "✅" : "❌", sub: p.grossProfit > 0 ? "Operación rentable" : "Operación en pérdida" },
                        { label: "Margen bruto", val: pct(p.grossMargin), color: +p.grossMargin > 20 ? "var(--c-ok)" : +p.grossMargin > 5 ? "var(--c-warn)" : "#ef4444", icon: "📊", sub: +p.grossMargin > 20 ? "Excelente" : +p.grossMargin > 5 ? "Aceptable" : "Revisar precio" },
                        { label: "ROI inversión", val: pct(p.roi), color: +p.roi > 15 ? "var(--c-ok)" : "var(--c-warn)", icon: "🔄", sub: "Retorno sobre costo prod." },
                      ].map(({ label, val, color, icon, sub }) => (
                        <div key={label} style={{ background: "var(--c-surface)", border: `1px solid ${color}44`, borderRadius: "12px", padding: "16px" }}>
                          <div style={{ fontSize: "22px", marginBottom: "6px" }}>{icon}</div>
                          <div style={{ fontSize: "10px", color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: ".6px" }}>{label}</div>
                          <div className="tc-num" style={{ fontSize: "22px", fontWeight: 800, color, margin: "4px 0" }}>{val}</div>
                          <div style={{ fontSize: "11px", color: "var(--c-muted)" }}>{sub}</div>
                        </div>
                      ))}
                    </div>

                    {/* Detalle P&L */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "12px", padding: "18px" }}>
                        <div style={{ fontSize: "11px", color: "var(--c-muted)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "14px", fontWeight: 600 }}>📋 Estado de P&L exportación</div>
                        {[
                          { label: "Ingreso (precio × unidades)", val: p.revenue, color: "var(--c-ok)" },
                          { label: "Costo de producción total", val: -p.totalProdCost, color: "#ef4444" },
                          { label: "Costos de exportación AR", val: -p.totalExportCost, color: "#ef4444" },
                          { label: "GANANCIA BRUTA", val: p.grossProfit, color: p.grossProfit > 0 ? "var(--c-ok)" : "#ef4444", bold: true },
                        ].map(({ label, val, color, bold }) => (
                          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #122033", fontSize: "13px" }}>
                            <span style={{ color: "var(--c-muted)" }}>{label}</span>
                            <span className="tc-num" style={{ fontWeight: bold ? 700 : 500, color }}>{val >= 0 ? fmt(val) : `-${fmt(Math.abs(val))}`}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "12px", padding: "18px" }}>
                        <div style={{ fontSize: "11px", color: "var(--c-muted)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "14px", fontWeight: 600 }}>🎯 Indicadores clave</div>
                        {[
                          { label: "Punto de equilibrio (unidades)", val: `${p.breakeven.toLocaleString()} u` },
                          { label: "Precio mínimo rentable / u", val: fmt(p.netPriceNeeded) },
                          { label: "Costo prod. por unidad", val: fmt(+productionCost / (+units || 1)) },
                          { label: "Costo exportación por unidad", val: fmt(p.totalExportCost / (+units || 1)) },
                          { label: "Costo total por unidad", val: fmt((p.totalProdCost + p.totalExportCost) / (+units || 1)) },
                          { label: "Precio de venta actual", val: fmt(+pricePerUnit) },
                        ].map(({ label, val }) => (
                          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #122033", fontSize: "13px" }}>
                            <span style={{ color: "var(--c-muted)" }}>{label}</span>
                            <span className="tc-num" style={{ fontWeight: 600 }}>{val}</span>
                          </div>
                        ))}
                        <div style={{ marginTop: "12px", padding: "10px", background: p.grossProfit > 0 ? "#00200f" : "#200000", borderRadius: "8px", fontSize: "12px", color: p.grossProfit > 0 ? "var(--c-ok)" : "#ef4444" }}>
                          {p.grossProfit > 0
                            ? `✅ Con ${p.breakeven} unidades cubrís costos. Sobre eso, ganás ${fmt(+pricePerUnit - p.netPriceNeeded)} por unidad.`
                            : `❌ El precio actual no cubre los costos. Necesitás al menos ${fmt(p.netPriceNeeded)} / unidad para no perder.`}
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
