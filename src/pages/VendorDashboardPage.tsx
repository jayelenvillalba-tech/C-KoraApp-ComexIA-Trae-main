import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useUser } from '@/context/user-context';
import Header from '@/components/header';
import { TrendingUp, Package, MessageSquare, Star, Edit3, Pause, Eye, ChevronRight, Play } from 'lucide-react';

const DS = {
  bg: 'var(--ds-bg-base)', bg2: '#090f18', bg3: 'var(--ds-bg-raised)', bd: '#0f2030',
  cyan: 'var(--ds-cyan)', green: 'var(--ds-green)', amber: 'var(--ds-amber)', red: 'var(--ds-red)', gold: 'var(--ds-gold)',
  t1: '#c8dff0', t2: '#8aafc0', t3: '#4a7090',
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500;600&display=swap');
  .vd { font-family:'Outfit',sans-serif; background:${DS.bg}; min-height:100vh; color:${DS.t1}; }
  .card { background:${DS.bg3}; border:1px solid ${DS.bd}; border-radius:8px; }
  .kpi-card { background:${DS.bg3}; border:1px solid ${DS.bd}; border-radius:8px; padding:20px; position:relative; overflow:hidden; transition:border-color .2s; }
  .kpi-card:hover { border-color:${DS.cyan}40; }
  .kpi-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--accent,${DS.cyan}),transparent); }
  .badge { font-family:'DM Mono',monospace; font-size:10px; font-weight:700; letter-spacing:.8px; padding:2px 8px; border-radius:2px; text-transform:uppercase; }
  .vd-btn { background:none; border:1px solid ${DS.bd}; border-radius:4px; padding:4px 10px; font-size:10px; font-family:'DM Mono',monospace; color:${DS.t3}; cursor:pointer; transition:all .15s; }
  .vd-btn:hover { border-color:${DS.cyan}50; color:${DS.cyan}; }
  .score-fill { transition:width .8s cubic-bezier(.4,0,.2,1); }
  ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:${DS.bd}; }
`;

interface Deal {
  id: string; product: string; hs_code: string;
  status: 'contact' | 'docs' | 'negotiation' | 'closed';
  price_usd?: number; quantity?: number; vendor_id: string; initiator_id: string;
  created_at: number; origin: string; destination: string;
}

const STAGE_ORDER = ['contact', 'docs', 'negotiation', 'closed'];
const STAGE_META: Record<string, { label: string; color: string }> = {
  contact: { label: 'Contacto iniciado', color: DS.cyan },
  docs: { label: 'Documentación', color: DS.amber },
  negotiation: { label: 'Negociación', color: DS.gold },
  closed: { label: 'Cerrado', color: DS.green },
};

// Mock offers table (would be pulled from marketplace_posts in a full build)
const MOCK_OFFERS = [
  { id: '1', product: 'Porotos de Soja Orgánica', ncm: '120190', price: 450, qty: 1000, unit: 'tn', views: 148, queries: 7, compat: 74, status: 'active' as const },
  { id: '2', product: 'Trigo Pan Alta Proteína', ncm: '100190', price: 280, qty: 500, unit: 'tn', views: 89, queries: 3, compat: 61, status: 'active' as const },
  { id: '3', product: 'Aceite de Girasol', ncm: '151219', price: 1100, qty: 300, unit: 'tn', views: 42, queries: 1, compat: 38, status: 'paused' as const },
];

const MARKET_COMPAT = [
  { region: 'MERCOSUR', pct: 89, count: '28 de 31', color: DS.green },
  { region: 'Europa', pct: 34, count: '12 de 35', color: DS.amber },
  { region: 'Asia', pct: 18, count: '6 de 33', color: DS.red },
  { region: 'Global', pct: 62, count: 'total', color: DS.cyan },
];

function KpiCard({ label, value, sub, icon, accent }: { label: string; value: string | number; sub?: string; icon: string; accent: string }) {
  return (
    <div className="kpi-card" style={{ '--accent': accent } as any}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: 0, fontSize: 10, color: DS.t3, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{label}</p>
          <p style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 32, fontWeight: 800, color: accent, lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ margin: '4px 0 0', fontSize: 11, color: DS.t3 }}>{sub}</p>}
        </div>
        <div style={{ fontSize: 24 }}>{icon}</div>
      </div>
    </div>
  );
}

function CompatBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 4, background: DS.bg2, borderRadius: 2, overflow: 'hidden', flex: 1 }}>
      <div className="score-fill" style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
    </div>
  );
}

export default function VendorDashboardPage() {
  const { user } = useUser();
  const [, navigate] = useLocation();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = (user as any)?.id || (user as any)?.userId || 'user-demo';

  // Auth guard — redirect to /auth if not logged in
  useEffect(() => {
    if (user === null) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/deals/user/${userId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.json())
      .then(d => { if (d.success) setDeals(d.data || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  // Group deals by status
  const dealsByStage = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = deals.filter(d => d.status === stage);
    return acc;
  }, {} as Record<string, Deal[]>);

  const activeDealCount = deals.filter(d => d.status !== 'closed').length;
  const closedDealCount = deals.filter(d => d.status === 'closed').length;

  return (
    <>
      <style>{CSS}</style>
      <div className="vd">
        <Header />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>

          {/* Page Title */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 28, fontWeight: 800, color: '#fff' }}>
                Panel del Vendedor
              </h1>
              <p style={{ margin: '4px 0 0', color: DS.t3, fontSize: 12, fontFamily: 'DM Mono, monospace' }}>
                Gestioná tus ofertas y deals de exportación
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigate('/control-panel')} className="vd-btn" style={{ border: `1px solid ${DS.cyan}30`, color: DS.t2, padding: '8px 14px', fontSize: 11 }}>
                🐛 Reportar feedback
              </button>
              <button onClick={() => navigate('/marketplace')} className="vd-btn" style={{ border: `1px solid ${DS.cyan}50`, color: DS.cyan, padding: '8px 16px', fontSize: 12 }}>
                + Nueva Oferta
              </button>
            </div>
          </div>

          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <KpiCard label="Ofertas Activas" value={MOCK_OFFERS.filter(o => o.status === 'active').length} sub="publicadas" icon="📦" accent={DS.cyan} />
            <KpiCard label="Consultas semana" value={MOCK_OFFERS.reduce((a, o) => a + o.queries, 0)} sub="sobre tus ofertas" icon="💬" accent={DS.amber} />
            <KpiCard label="Deals en curso" value={activeDealCount} sub={`${closedDealCount} cerrados`} icon="🤝" accent={DS.green} />
            <KpiCard label="Reputación" value="4.8★" sub="2 reseñas positivas" icon="⭐" accent={DS.gold} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
            {/* ── Left Column ─────────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Active Offers Table */}
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${DS.bd}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff' }}>Mis Ofertas Activas</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${DS.bd}` }}>
                        {['Producto', 'NCM', 'Precio', 'Cant.', 'Vistas', 'Consultas', 'Compat.', 'Estado', ''].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 9, fontFamily: 'DM Mono, monospace', color: DS.t3, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_OFFERS.map(offer => (
                        <tr key={offer.id} style={{ borderBottom: `1px solid ${DS.bd}`, transition: 'background .15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = DS.bg2)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '10px 12px', fontSize: 12, color: DS.t1 }}>{offer.product}</td>
                          <td style={{ padding: '10px 12px', fontSize: 11, color: DS.t3, fontFamily: 'DM Mono, monospace' }}>{offer.ncm}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12, color: DS.cyan, fontFamily: 'DM Mono, monospace' }}>${offer.price}/tn</td>
                          <td style={{ padding: '10px 12px', fontSize: 11, color: DS.t2, fontFamily: 'DM Mono, monospace' }}>{offer.qty} {offer.unit}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12, color: DS.t2 }}>{offer.views}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12, color: offer.queries > 0 ? DS.amber : DS.t3 }}>{offer.queries}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ flex: 1 }}><CompatBar pct={offer.compat} color={offer.compat > 60 ? DS.green : offer.compat > 40 ? DS.amber : DS.red} /></div>
                              <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: DS.t3 }}>{offer.compat}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span className="badge" style={{ background: offer.status === 'active' ? `${DS.green}20` : `${DS.amber}20`, color: offer.status === 'active' ? DS.green : DS.amber }}>
                              {offer.status === 'active' ? 'Activa' : 'Pausada'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="vd-btn"><Edit3 size={10} /></button>
                              <button className="vd-btn">{offer.status === 'active' ? <Pause size={10} /> : <Play size={10} />}</button>
                              <button className="vd-btn" onClick={() => navigate('/chat')} style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={10} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Deal Pipeline */}
              <div className="card" style={{ padding: '14px 18px' }}>
                <p style={{ margin: '0 0 16px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff' }}>Pipeline de Deals</p>

                {loading && <p style={{ color: DS.t3, fontSize: 12, fontFamily: 'DM Mono, monospace' }}>Cargando deals…</p>}

                {!loading && STAGE_ORDER.map(stage => {
                  const stageMeta = STAGE_META[stage];
                  const stageDeals = dealsByStage[stage] || [];
                  return (
                    <div key={stage} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ height: 1, flex: '0 0 16px', background: stageMeta.color + '60' }} />
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: stageMeta.color, textTransform: 'uppercase', letterSpacing: 1, flexShrink: 0 }}>
                          {stageMeta.label} ({stageDeals.length})
                        </span>
                        <div style={{ height: 1, flex: 1, background: stageMeta.color + '20' }} />
                      </div>
                      {stageDeals.length === 0 ? (
                        <p style={{ margin: '4px 0 0 24px', fontSize: 11, color: DS.t3, fontFamily: 'DM Mono, monospace', fontStyle: 'italic' }}>Vacío</p>
                      ) : stageDeals.map(deal => (
                        <div key={deal.id} style={{ display: 'flex', alignItems: 'center', background: DS.bg2, border: `1px solid ${DS.bd}`, borderRadius: 6, padding: '10px 14px', marginBottom: 6, gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: stageMeta.color + '20', border: `1px solid ${stageMeta.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, color: stageMeta.color, flexShrink: 0 }}>
                            {deal.product[0]?.toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 12, color: DS.t1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deal.product}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 10, color: DS.t3, fontFamily: 'DM Mono, monospace' }}>
                              {deal.origin}→{deal.destination} · {deal.price_usd ? `$${deal.price_usd?.toLocaleString()}/tn` : 'Precio en negociación'}
                            </p>
                          </div>
                          <button onClick={() => navigate(`/chat/${deal.id}`)} className="vd-btn" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                            Ver chat <ChevronRight size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Right Column ─────────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Market Compatibility */}
              <div className="card" style={{ padding: 18 }}>
                <p style={{ margin: '0 0 14px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: '#fff' }}>
                  Compatibilidad de Mercado
                </p>
                <p style={{ margin: '0 0 14px', fontSize: 11, color: DS.t3, lineHeight: 1.5 }}>
                  Con tu documentación actual podés operar:
                </p>
                {MARKET_COMPAT.map(m => (
                  <div key={m.region} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: DS.t2 }}>{m.region}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: DS.t3, fontFamily: 'DM Mono, monospace' }}>{m.count}</span>
                        <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: m.color, fontWeight: 700 }}>{m.pct}%</span>
                      </div>
                    </div>
                    <CompatBar pct={m.pct} color={m.color} />
                  </div>
                ))}
                <div style={{ marginTop: 14, padding: 10, background: `${DS.cyan}08`, border: `1px solid ${DS.cyan}20`, borderRadius: 6 }}>
                  <p style={{ margin: 0, fontSize: 11, color: DS.t2, lineHeight: 1.5 }}>
                    💡 Completá <strong style={{ color: DS.cyan }}>"Certificado de Origen MERCOSUR"</strong> para acceder a 14 ofertas más
                  </p>
                  <button onClick={() => navigate('/onboarding')} style={{ background: 'none', border: 'none', color: DS.cyan, fontSize: 11, fontFamily: 'DM Mono, monospace', cursor: 'pointer', marginTop: 6, padding: 0, textDecoration: 'underline' }}>
                    Completar documentación →
                  </button>
                </div>
              </div>

              {/* Reputation */}
              <div className="card" style={{ padding: 18 }}>
                <p style={{ margin: '0 0 14px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: '#fff' }}>
                  Reputación
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 42, fontWeight: 800, color: DS.gold }}>4.8</span>
                  <span style={{ fontSize: 20, color: DS.gold }}>★★★★½</span>
                </div>
                {[
                  { label: 'Tiempo de respuesta', value: '< 2 horas', ok: true },
                  { label: 'Deals cerrados', value: '3 exitosos', ok: true },
                  { label: 'Documentación completa', value: '85%', ok: false },
                  { label: 'Reseñas recibidas', value: '2 positivas', ok: true },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${DS.bd}` }}>
                    <span style={{ fontSize: 11, color: DS.t2 }}>{item.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: DS.t1 }}>{item.value}</span>
                      <span style={{ fontSize: 12, color: item.ok ? DS.green : DS.amber }}>{item.ok ? '✓' : '⚠'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
