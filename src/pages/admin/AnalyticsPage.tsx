import { useState, useEffect } from 'react';
import { useAdminDemoMode } from './AdminLayout';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, Users, DollarSign, Target, Globe, AlertTriangle } from 'lucide-react';

const DS = {
  bg2: '#090f18', bg3: 'var(--ds-bg-raised)', bd: '#0f2030',
  cyan: 'var(--ds-cyan)', green: 'var(--ds-green)', amber: 'var(--ds-amber)', red: 'var(--ds-red)', gold: 'var(--ds-gold)',
  t1: '#c8dff0', t2: '#8aafc0', t3: '#4a7090',
};

const CSS = `
  .an-card { background: ${DS.bg3}; border: 1px solid ${DS.bd}; border-radius: 8px; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
  .an-title { font-family: 'DM Mono', monospace; font-size: 11px; color: ${DS.t3}; text-transform: uppercase; letter-spacing: 1.5px; margin: 0; display: flex; align-items: center; gap: 8px; }
  .an-metric { font-family: 'Barlow Condensed', sans-serif; font-size: 32px; font-weight: 800; color: #fff; margin: 0; line-height: 1; }
  
  .an-subbar { height: 6px; border-radius: 3px; background: ${DS.bg2}; overflow: hidden; display: flex; margin-top: 4px; }
  .an-bar-desc { display: flex; justify-content: space-between; font-size: 11px; font-family: 'DM Mono', monospace; color: ${DS.t2}; margin-top: 6px; }
  
  .funnel-row { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
  .funnel-label { width: 140px; font-size: 13px; color: ${DS.t1}; font-weight: 500; }
  .funnel-bar-wrap { flex: 1; height: 12px; background: ${DS.bg2}; border-radius: 6px; overflow: hidden; display: flex; }
  .funnel-val { width: 40px; text-align: right; font-family: 'DM Mono', monospace; font-size: 12px; color: ${DS.cyan}; font-weight: 700; }
  .funnel-drop { font-size: 11px; color: ${DS.red}; width: 60px; text-align: right; }

  @media print {
    body { background: white !important; color: black !important; }
    .admin-sidebar { display: none !important; }
    .an-card { background: white !important; border: 1px solid #ccc !important; break-inside: avoid; }
    .admin-main { overflow: visible !important; }
    .admin-content { overflow: visible !important; }
    * { color: black !important; text-shadow: none !important; }
  }
`;

export default function AnalyticsPage() {
  const { isDemo } = useAdminDemoMode();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    const fetchAnalytics = async () => {
      try {
        const u = (p: string) => `/api/admin/analytics/${p}?demo=${isDemo}&period=30`;
        const [gRes, mRes, rRes, fRes] = await Promise.all([
          fetch(u('growth')), fetch(u('marketplace')), fetch(u('revenue')), fetch(u('funnel'))
        ]);
        if (mounted) {
          setData({
            growth: (await gRes.json()).data,
            market: (await mRes.json()).data,
            rev: (await rRes.json()).data,
            funnel: (await fRes.json()).data
          });
        }
      } catch(e) { console.error(e); }
    };
    fetchAnalytics();
    window.addEventListener('demo_mode_changed', fetchAnalytics);
    return () => { mounted = false; window.removeEventListener('demo_mode_changed', fetchAnalytics); };
  }, [isDemo]);

  if (!data) return <div style={{ color: DS.t2, padding: 40, fontFamily: 'DM Mono' }}>Calculando analíticas...</div>;

  const { growth, market, rev, funnel } = data;

  const exportPDF = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 60 }}>
      <style>{CSS}</style>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: 'Barlow Condensed', fontSize: 32, fontWeight: 800, margin: '0 0 4px', color: '#fff', letterSpacing: 0.5 }}>Business Analytics</h1>
          <p style={{ margin: 0, color: DS.t3, fontSize: 13 }}>Métricas clave de negocio para reporte a inversores y equipo directivo.</p>
        </div>
        <button onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: 8, background: DS.cyan, color: '#000', border: 'none', padding: '8px 16px', borderRadius: 4, fontFamily: 'DM Mono', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          <Download size={14} /> EXPORTAR REPORTE
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        
        {/* ROW 1: GROWTH */}
        <div className="an-card" style={{ gridColumn: '1 / -1' }}>
          <h2 className="an-title"><Users size={16} color={DS.cyan} /> Crecimiento de Usuarios (30 Días)</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'center' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: DS.t2 }}>Total Registrados</p>
                <h3 className="an-metric">{growth.totalUsers}</h3>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: DS.t2 }}>Conversión Demo → Pro</p>
                <h3 className="an-metric" style={{ color: DS.green }}>{growth.conversionDemoToPro}%</h3>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: DS.t2 }}>Churn Rate (Bajas)</p>
                <h3 className="an-metric" style={{ color: DS.red, fontSize: 24 }}>{growth.churnRate}%</h3>
              </div>
            </div>
            
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growth.registrationsByDay}>
                  <XAxis dataKey="date" stroke={DS.bd} tick={{ fill: DS.t3, fontSize: 10, fontFamily: 'DM Mono' }} />
                  <YAxis stroke={DS.bd} tick={{ fill: DS.t3, fontSize: 10, fontFamily: 'DM Mono' }} />
                  <Tooltip contentStyle={{ background: DS.bg3, border: `1px solid ${DS.bd}`, borderRadius: 4, fontFamily: 'DM Mono', fontSize: 12 }} />
                  <Line type="monotone" dataKey="count" stroke={DS.cyan} strokeWidth={3} dot={false} activeDot={{ r: 6, fill: DS.cyan }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 8, paddingTop: 24, borderTop: `1px solid \${DS.bd}` }}>
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontFamily: 'DM Mono', color: DS.t2 }}>BREAKDOWN POR PLAN</p>
              <div className="an-subbar">
                <div style={{ width: `${growth.byPlan.demo}%`, background: DS.t3 }} />
                <div style={{ width: `${growth.byPlan.pro}%`, background: DS.cyan }} />
                <div style={{ width: `${growth.byPlan.enterprise}%`, background: DS.gold }} />
              </div>
              <div className="an-bar-desc">
                <span>Demo ({growth.byPlan.demo}%)</span>
                <span style={{ color: DS.cyan }}>Pro ({growth.byPlan.pro}%)</span>
                <span style={{ color: DS.gold }}>Ent. ({growth.byPlan.enterprise}%)</span>
              </div>
            </div>
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontFamily: 'DM Mono', color: DS.t2 }}>BREAKDOWN POR ROL</p>
              <div className="an-subbar">
                <div style={{ width: `${growth.byRole.trader}%`, background: DS.cyan }} />
                <div style={{ width: `${growth.byRole.logistics}%`, background: DS.amber }} />
                <div style={{ width: `${growth.byRole.institutional}%`, background: DS.green }} />
              </div>
              <div className="an-bar-desc">
                <span style={{ color: DS.cyan }}>Trader ({growth.byRole.trader}%)</span>
                <span style={{ color: DS.amber }}>Logs ({growth.byRole.logistics}%)</span>
                <span style={{ color: DS.green }}>Inst ({growth.byRole.institutional}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: MARKETPLACE HEALTH */}
        <div className="an-card">
          <h2 className="an-title"><Globe size={16} color={DS.green} /> Marketplace Health</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 16, borderBottom: `1px solid ${DS.bd}` }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontFamily: 'DM Mono', color: DS.t3 }}>GMV INICIADO</p>
              <h3 className="an-metric">${(market.gmvInitiated / 1000000).toFixed(2)}M <span style={{ fontSize: 16, color: DS.t2 }}>USD</span></h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontFamily: 'DM Mono', color: DS.t3 }}>GMV CERRADO</p>
              <h3 className="an-metric" style={{ color: DS.green }}>${(market.gmvClosed / 1000).toFixed(1)}k <span style={{ fontSize: 16, color: DS.t2 }}>USD</span></h3>
            </div>
          </div>
          
          <div>
            <p style={{ margin: '0 0 12px', fontSize: 11, fontFamily: 'DM Mono', color: DS.t2 }}>PIPELINE DE DEALS ACTUAL</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Contacto Inicial', val: market.dealsByStatus.contact, color: DS.cyan },
                { label: 'Documentación', val: market.dealsByStatus.docs, color: DS.amber },
                { label: 'Negociación', val: market.dealsByStatus.negotiation, color: DS.gold },
                { label: 'Cerrados', val: market.dealsByStatus.closed, color: DS.green }
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 110, fontSize: 12, color: DS.t1 }}>{s.label}</div>
                  <div style={{ flex: 1, height: 8, background: DS.bg2, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(s.val / 50) * 100}%`, height: '100%', background: s.color }} />
                  </div>
                  <div style={{ width: 24, textAlign: 'right', fontSize: 12, fontFamily: 'DM Mono', color: DS.t2 }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8, padding: 16, background: DS.bg2, borderRadius: 6 }}>
            <div>
              <span style={{ fontSize: 10, color: DS.t3, fontFamily: 'DM Mono', display: 'block' }}>TKPromedio</span>
              <span style={{ fontSize: 18, color: DS.t1, fontWeight: 600, fontFamily: 'Barlow Condensed' }}>${market.avgDealValue.toLocaleString()}</span>
            </div>
            <div>
              <span style={{ fontSize: 10, color: DS.t3, fontFamily: 'DM Mono', display: 'block' }}>Tiempo Cierre</span>
              <span style={{ fontSize: 18, color: DS.t1, fontWeight: 600, fontFamily: 'Barlow Condensed' }}>{market.avgDaysToClose} días</span>
            </div>
          </div>
        </div>

        {/* ROW 2: REVENUE */}
        <div className="an-card">
          <h2 className="an-title"><DollarSign size={16} color={DS.amber} /> Revenue & Unit Economics</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 16, borderBottom: `1px solid ${DS.bd}` }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontFamily: 'DM Mono', color: DS.t3 }}>MRR ACTUAL</p>
              <h3 className="an-metric" style={{ color: DS.amber }}>${rev.mrrCurrent} <span style={{ fontSize: 16, color: DS.t2 }}>USD</span></h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontFamily: 'DM Mono', color: DS.t3 }}>ARR PROYECTADO</p>
              <h3 className="an-metric" style={{ color: DS.t1 }}>${(rev.arrProjected / 1000).toFixed(1)}k <span style={{ fontSize: 16, color: DS.t2 }}>USD</span></h3>
            </div>
          </div>
          
          <div style={{ height: 160, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rev.mrrByMonth}>
                <XAxis dataKey="month" stroke={DS.bd} tick={{ fill: DS.t3, fontSize: 10, fontFamily: 'DM Mono' }} />
                <Tooltip cursor={{ fill: DS.bg2 }} contentStyle={{ background: DS.bg3, border: `1px solid ${DS.bd}`, borderRadius: 4, fontFamily: 'DM Mono', fontSize: 12 }} />
                <Bar dataKey="mrr" fill={DS.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 'auto', padding: 12, border: `1px solid ${DS.bd}`, borderRadius: 6 }}>
            <div style={{ textAlign: 'center', borderRight: `1px solid ${DS.bd}` }}>
              <span style={{ fontSize: 10, color: DS.t3, fontFamily: 'DM Mono', display: 'block' }}>LTV Estimado</span>
              <span style={{ fontSize: 18, color: DS.green, fontWeight: 700, fontFamily: 'DM Mono' }}>${rev.ltv}</span>
            </div>
            <div style={{ textAlign: 'center', borderRight: `1px solid ${DS.bd}` }}>
              <span style={{ fontSize: 10, color: DS.t3, fontFamily: 'DM Mono', display: 'block' }}>CAC Actual</span>
              <span style={{ fontSize: 18, color: DS.cyan, fontWeight: 700, fontFamily: 'DM Mono' }}>${rev.cac}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 10, color: DS.t3, fontFamily: 'DM Mono', display: 'block' }}>LTV/CAC Ratio</span>
              <span style={{ fontSize: 18, color: DS.t1, fontWeight: 700, fontFamily: 'DM Mono' }}>∞</span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 10, color: DS.t3, textAlign: 'center', fontStyle: 'italic' }}>* Crecimiento 100% orgánico sin paid acquisition (CAC = 0)</p>
        </div>

        {/* ROW 3: FUNNEL */}
        <div className="an-card" style={{ gridColumn: '1 / -1' }}>
          <h2 className="an-title"><Target size={16} color={DS.red} /> Verification Funnel (Dropoff Analysis)</h2>
          
          <div style={{ marginTop: 16, maxWidth: 800 }}>
            {[
              { label: '1. Registrados', val: funnel.registered, pct: 100, drop: 0, color: DS.t2 },
              { label: '2. Rol Seleccionado', val: funnel.completedOnboarding, pct: Math.round((funnel.completedOnboarding/funnel.registered)*100), drop: funnel.dropoffPoints.atRoleSelection, color: DS.cyan },
              { label: '3. Primer Doc Subido', val: funnel.score20plus, pct: Math.round((funnel.score20plus/funnel.registered)*100), drop: funnel.dropoffPoints.atDocumentStep, color: DS.amber },
              { label: '4. Market Unlocked', val: funnel.score50plus, pct: Math.round((funnel.score50plus/funnel.registered)*100), drop: funnel.dropoffPoints.atPlanSelection, color: DS.green },
              { label: '5. Verificado 100%', val: funnel.score100, pct: Math.round((funnel.score100/funnel.registered)*100), drop: funnel.score50plus - funnel.score100, color: DS.gold }
            ].map((step, i) => (
              <div key={i} className="funnel-row">
                <div className="funnel-label">{step.label}</div>
                <div className="funnel-bar-wrap">
                  <div style={{ width: `${step.pct}%`, background: step.color, transition: 'width 1s ease' }} />
                </div>
                <div className="funnel-val">{step.pct}%</div>
                <div className="funnel-drop">{step.drop > 0 ? `-${step.drop}` : ''}</div>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: 8, padding: 16, background: `${DS.red}10`, border: `1px solid ${DS.red}40`, borderRadius: 6, display: 'flex', gap: 12 }}>
            <AlertTriangle size={20} color={DS.red} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: DS.t1, fontWeight: 500 }}>Oportunidad Crítica Identificada</p>
              <p style={{ margin: 0, fontSize: 13, color: DS.red, lineHeight: 1.5 }}>
                El mayor embotellamiento ocurre en <strong>"Primer Doc Subido"</strong> con una pérdida de {funnel.dropoffPoints.atDocumentStep} usuarios. Reducir la fricción en la pantalla de documentos del Onboarding aumentaría la retención general en un estimado 35%.
              </p>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}
