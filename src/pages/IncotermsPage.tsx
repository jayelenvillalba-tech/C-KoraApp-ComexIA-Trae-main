import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/components/header';
import { Zap, ChevronRight, Info } from 'lucide-react';
import { useUser } from '@/context/user-context';

const DS = {
  bg: 'var(--ds-bg-base)', bg2: '#090f18', bg3: 'var(--ds-bg-raised)', bd: '#0f2030',
  cyan: 'var(--ds-cyan)', green: 'var(--ds-green)', amber: 'var(--ds-amber)', red: 'var(--ds-red)', gold: 'var(--ds-gold)',
  t1: '#c8dff0', t2: '#8aafc0', t3: '#4a7090',
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500;600&display=swap');
  .inc-page { font-family:'Outfit',sans-serif; background:${DS.bg}; min-height:100vh; color:${DS.t1}; }
  .inc-card { background:${DS.bg3}; border:1px solid ${DS.bd}; border-radius:8px; }
  .inc-btn { font-family:'DM Mono',monospace; font-weight:700; border-radius:4px; cursor:pointer; transition:all .15s; font-size:11px; border:none; padding:6px 14px; }
  .inc-chip { background:none; border:1px solid ${DS.bd}; border-radius:4px; padding:5px 12px; color:${DS.t2}; font-size:11px; font-family:'DM Mono',monospace; cursor:pointer; transition:all .15s; }
  .inc-chip:hover { border-color:${DS.cyan}50; color:${DS.cyan}; }
  .inc-chip.active { background:${DS.cyan}18; border-color:${DS.cyan}60; color:${DS.cyan}; }
  .inc-input { width:100%; background:${DS.bg2}; border:1px solid ${DS.bd}; border-radius:4px; padding:9px 12px; color:${DS.t1}; font-family:'Outfit',sans-serif; font-size:13px; box-sizing:border-box; outline:none; transition:border-color .15s; }
  .inc-input:focus { border-color:${DS.cyan}60; }
  .inc-select { background:${DS.bg2}; border:1px solid ${DS.bd}; border-radius:4px; padding:9px 10px; color:${DS.t1}; font-family:'DM Mono',monospace; font-size:12px; outline:none; cursor:pointer; }
  .tooltip-wrap { position:relative; display:inline-block; }
  .tooltip-box { display:none; position:absolute; bottom:120%; left:50%; transform:translateX(-50%); background:var(--ds-bg-raised); border:1px solid ${DS.bd}; border-radius:4px; padding:6px 10px; font-size:10px; color:${DS.t2}; white-space:nowrap; z-index:100; font-family:'Outfit',sans-serif; min-width:180px; white-space:normal; max-width:220px; line-height:1.4; }
  .tooltip-wrap:hover .tooltip-box { display:block; }
  .incoterm-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(100px,1fr)); gap:8px; }
  ::-webkit-scrollbar { width:3px; } ::-webkit-scrollbar-thumb { background:var(--ds-border-default); }
  @keyframes bar-grow { from { width:0 } to { width:var(--w) } }
`;

// ─── All 11 Incoterms 2020 ────────────────────────────────────────────────────
const INCOTERMS_2020 = [
  { code: 'EXW', name: 'Ex Works', sellerLoad: 0, desc: 'El vendedor solo pone la mercadería disponible en su fábrica. El comprador organiza TODO el transporte.', group: 'E' },
  { code: 'FCA', name: 'Free Carrier', sellerLoad: 20, desc: 'El vendedor entrega la mercadería a un transportista designado por el comprador. Muy flexible.', group: 'F' },
  { code: 'FAS', name: 'Free Alongside Ship', sellerLoad: 30, desc: 'El vendedor deja la mercadería al costado del buque en el puerto de origen. Solo marítimo.', group: 'F' },
  { code: 'FOB', name: 'Free On Board', sellerLoad: 35, desc: 'El más usado en Argentina. El vendedor entrega la mercadería a bordo del buque. Riesgo pasa al comprador cuando cruza la borda.', group: 'F' },
  { code: 'CFR', name: 'Cost & Freight', sellerLoad: 55, desc: 'El vendedor paga el flete hasta el puerto de destino, pero el riesgo pasa al comprador en el puerto de origen.', group: 'C' },
  { code: 'CIF', name: 'Cost Insurance & Freight', sellerLoad: 65, desc: 'Como CFR pero el vendedor también contrata el seguro. Muy pedido por compradores asiáticos.', group: 'C' },
  { code: 'CPT', name: 'Carriage Paid To', sellerLoad: 60, desc: 'El vendedor paga el transporte hasta el destino acordado. Válido para todos los modos de transporte.', group: 'C' },
  { code: 'CIP', name: 'Carriage & Insurance Paid', sellerLoad: 70, desc: 'Como CPT pero con seguro incluido. Nueva en 2020: la cobertura mínima del seguro aumentó.', group: 'C' },
  { code: 'DAP', name: 'Delivered At Place', sellerLoad: 80, desc: 'El vendedor entrega en el lugar acordado en destino, sin pagar importación. El comprador hace el despacho local.', group: 'D' },
  { code: 'DPU', name: 'Delivered at Place Unloaded', sellerLoad: 85, desc: 'El vendedor entrega y DESCARGA en el lugar de destino. Única regla donde el vendedor debe descargar.', group: 'D' },
  { code: 'DDP', name: 'Delivered Duty Paid', sellerLoad: 100, desc: 'El vendedor paga TODO: transporte, seguro y aranceles de importación. Máxima responsabilidad del vendedor.', group: 'D' },
];

const GROUP_COLORS: Record<string, string> = { E: DS.t3, F: DS.cyan, C: DS.amber, D: DS.green };

// ─── Tooltip Wrapper ──────────────────────────────────────────────────────────
function Tooltip({ tip, children }: { tip: string; children: React.ReactNode }) {
  return (
    <div className="tooltip-wrap">
      {children}
      <div className="tooltip-box">{tip}</div>
    </div>
  );
}

// ─── Cost Distribution Bar ────────────────────────────────────────────────────
function CostBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: DS.t2, fontFamily: 'DM Mono, monospace' }}>{label}</span>
        <span style={{ fontSize: 11, color, fontFamily: 'DM Mono, monospace', fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: DS.bg2, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width .8s cubic-bezier(.4,0,.2,1)' }} />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function IncotermsPage() {
  const { user } = useUser();
  const { i18n } = useTranslation();

  const [product, setProduct] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [origin, setOrigin] = useState('AR');
  const [destination, setDestination] = useState('CN');
  const [productType, setProductType] = useState<'bulk' | 'packaged' | 'perishable' | 'dangerous'>('packaged');
  const [experience, setExperience] = useState<'new' | 'intermediate' | 'expert'>('new');
  const [role, setRole] = useState<'exporter' | 'importer'>('exporter');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const COUNTRIES = [
    ['AR', '🇦🇷 Argentina'], ['BR', '🇧🇷 Brasil'], ['CN', '🇨🇳 China'],
    ['US', '🇺🇸 USA'], ['DE', '🇩🇪 Alemania'], ['CL', '🇨🇱 Chile'],
    ['UY', '🇺🇾 Uruguay'], ['MX', '🇲🇽 México'], ['FR', '🇫🇷 Francia'],
    ['IN', '🇮🇳 India'], ['JP', '🇯🇵 Japón'], ['KR', '🇰🇷 Corea'],
  ];

  const handleCalculate = async () => {
    if (!product.trim()) { setError('Ingresá el nombre del producto'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/incoterms/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product, hsCode, origin, destination,
          sellerExperience: experience, productType,
          userRole: role, language: i18n.language || 'es'
        })
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
      else setError('Error al calcular. Intentá de nuevo.');
    } catch (e) {
      setError('Error de conexión con el servidor.');
    } finally { setLoading(false); }
  };

  const recommended = INCOTERMS_2020.find(i => i.code === result?.recommended);

  const PRODUCT_TYPES: [string, string][] = [['bulk', '📦 Granel'], ['packaged', '📫 Empacado'], ['perishable', '🌡️ Perecedero'], ['dangerous', '⚠️ Peligroso']];
  const EXPERIENCES: [string, string][] = [['new', '🌱 Nueva PyME'], ['intermediate', '📊 Intermedio'], ['expert', '🏆 Experto']];
  const ROLES: [string, string][] = [['exporter', '📤 Exportador'], ['importer', '📥 Importador']];

  return (
    <>
      <style>{CSS}</style>
      <div className="inc-page">
        <Header />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

          {/* Page Title */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: .5 }}>
              Incoterms 2020 — <span style={{ color: DS.cyan }}>Simulador IA</span>
            </h1>
            <p style={{ margin: '6px 0 0', color: DS.t3, fontSize: 13, fontFamily: 'DM Mono, monospace' }}>
              Encontrá el término de comercio más conveniente para tu operación con recomendación IA personalizada
            </p>
          </div>

          {/* Main Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>

            {/* ── Left: Configurator ─────────────────────────────────────── */}
            <div className="inc-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: DS.t3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: -8 }}>Configurador</div>

              {/* Product */}
              <div>
                <label style={{ display: 'block', fontFamily: 'DM Mono, monospace', fontSize: 10, color: DS.t3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Producto</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="inc-input" value={product} onChange={e => setProduct(e.target.value)} placeholder="Ej: Porotos de Soja Orgánica" style={{ flex: 2 }} />
                  <input className="inc-input" value={hsCode} onChange={e => setHsCode(e.target.value)} placeholder="HS Code" style={{ flex: 1 }} />
                </div>
              </div>

              {/* Route */}
              <div>
                <label style={{ display: 'block', fontFamily: 'DM Mono, monospace', fontSize: 10, color: DS.t3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Ruta</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <select className="inc-select" value={origin} onChange={e => setOrigin(e.target.value)} style={{ flex: 1 }}>
                    {COUNTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                  </select>
                  <ChevronRight size={16} color={DS.t3} style={{ flexShrink: 0 }} />
                  <select className="inc-select" value={destination} onChange={e => setDestination(e.target.value)} style={{ flex: 1 }}>
                    {COUNTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                  </select>
                </div>
              </div>

              {/* Product Type */}
              <div>
                <label style={{ display: 'block', fontFamily: 'DM Mono, monospace', fontSize: 10, color: DS.t3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Tipo de Producto</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {PRODUCT_TYPES.map(([val, label]) => (
                    <button key={val} className={`inc-chip ${productType === val ? 'active' : ''}`} onClick={() => setProductType(val as any)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div>
                <label style={{ display: 'block', fontFamily: 'DM Mono, monospace', fontSize: 10, color: DS.t3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Experiencia del Exportador</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {EXPERIENCES.map(([val, label]) => (
                    <button key={val} className={`inc-chip ${experience === val ? 'active' : ''}`} onClick={() => setExperience(val as any)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Role */}
              <div>
                <label style={{ display: 'block', fontFamily: 'DM Mono, monospace', fontSize: 10, color: DS.t3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Mi Rol</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {ROLES.map(([val, label]) => (
                    <button key={val} className={`inc-chip ${role === val ? 'active' : ''}`} onClick={() => setRole(val as any)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p style={{ margin: 0, color: DS.red, fontSize: 12, fontFamily: 'DM Mono, monospace' }}>⚠ {error}</p>}

              <button
                onClick={handleCalculate}
                disabled={loading}
                className="inc-btn"
                style={{ background: loading ? DS.bd : DS.cyan, color: 'var(--ds-bg-base)', padding: '10px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 4 }}
              >
                {loading ? 'Calculando…' : (<><Zap size={14} /> Calcular recomendación IA →</>)}
              </button>
            </div>

            {/* ── Right: Result ────────────────────────────────────────────── */}
            <div className="inc-card" style={{ padding: 24 }}>
              {!result ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: DS.t3, gap: 12, minHeight: 300 }}>
                  <div style={{ fontSize: 36 }}>⚖️</div>
                  <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, textAlign: 'center' }}>
                    Configurá tu operación y hacé clic en<br />"Calcular recomendación IA"
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Recommended */}
                  <div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: DS.t3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Incoterm Recomendado</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 44, fontWeight: 800, color: DS.cyan }}>{result.recommended}</span>
                      <span style={{ fontSize: 12, color: DS.t2 }}>★ {recommended?.name}</span>
                    </div>
                    <p style={{ margin: '10px 0 0', fontSize: 13, color: DS.t2, lineHeight: 1.6 }}>{result.reasoning}</p>
                  </div>

                  {/* Cost Distribution */}
                  <div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: DS.t3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Distribución de Responsabilidades</div>
                    <CostBar label="Vendedor" pct={recommended?.sellerLoad || 50} color={DS.amber} />
                    <CostBar label="Comprador" pct={100 - (recommended?.sellerLoad || 50)} color={DS.cyan} />
                  </div>

                  {/* Alternatives */}
                  {result.alternatives?.length > 0 && (
                    <div>
                      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: DS.t3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Alternativas</div>
                      {result.alternatives.map((alt: any) => (
                        <div key={alt.incoterm} style={{ background: DS.bg2, border: `1px solid ${DS.bd}`, borderRadius: 6, padding: 12, marginBottom: 8 }}>
                          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 700, color: DS.t1 }}>{alt.incoterm}</span>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                            <div style={{ fontSize: 11, color: DS.green, lineHeight: 1.4 }}>✓ {alt.pros}</div>
                            <div style={{ fontSize: 11, color: DS.red, lineHeight: 1.4 }}>✗ {alt.cons}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Cost Impact */}
                  {result.costImpact && (
                    <div style={{ background: DS.bg2, border: `1px solid ${DS.bd}`, borderRadius: 6, padding: 12 }}>
                      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: DS.t3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Estimación de Costos</div>
                      <p style={{ margin: '0 0 6px', fontSize: 11, color: DS.t2, lineHeight: 1.5 }}>
                        <span style={{ color: DS.amber }}>Vendedor: </span>{result.costImpact.sellerEstimation}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: DS.t2, lineHeight: 1.5 }}>
                        <span style={{ color: DS.cyan }}>Comprador: </span>{result.costImpact.buyerEstimation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Full 11-Term Grid ───────────────────────────────────────────── */}
          <div className="inc-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 700 }}>Comparativa — Los 11 Incoterms 2020</h2>
            </div>
            <div className="incoterm-grid">
              {INCOTERMS_2020.map(inc => {
                const isRec = result?.recommended === inc.code;
                return (
                  <Tooltip key={inc.code} tip={inc.desc}>
                    <div style={{
                      background: isRec ? `${DS.cyan}15` : DS.bg2,
                      border: `1px solid ${isRec ? DS.cyan + '60' : DS.bd}`,
                      borderRadius: 6, padding: 12, cursor: 'help', transition: 'all .15s',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 800, color: isRec ? DS.cyan : DS.t1 }}>{inc.code}</span>
                        <span style={{ fontSize: 9, color: GROUP_COLORS[inc.group], fontFamily: 'DM Mono, monospace', fontWeight: 700, padding: '1px 4px', background: GROUP_COLORS[inc.group] + '20', borderRadius: 2 }}>{inc.group}</span>
                      </div>
                      <p style={{ margin: '0 0 8px', fontSize: 10, color: DS.t3, lineHeight: 1.3 }}>{inc.name}</p>
                      {/* Responsibility bar */}
                      <div style={{ height: 3, background: DS.bd, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${inc.sellerLoad}%`, background: DS.amber, borderRadius: 2, transition: 'width .6s' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                        <span style={{ fontSize: 8, color: DS.amber, fontFamily: 'DM Mono, monospace' }}>Vendedor {inc.sellerLoad}%</span>
                        <span style={{ fontSize: 8, color: DS.cyan, fontFamily: 'DM Mono, monospace' }}>C.{100 - inc.sellerLoad}%</span>
                      </div>
                      {isRec && <div style={{ marginTop: 6, fontSize: 9, color: DS.cyan, fontFamily: 'DM Mono, monospace', fontWeight: 700 }}>★ RECOMENDADO</div>}
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
