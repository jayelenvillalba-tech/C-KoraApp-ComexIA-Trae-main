import { useEffect, useState } from 'react';
import { useAdminDemoMode } from './AdminLayout';
import { AlertCircle, ArrowRight, UserPlus, FileText, Activity, AlertTriangle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const DS = {
  bg2: '#090f18', bg3: 'var(--ds-bg-raised)', bd: '#0f2030',
  cyan: 'var(--ds-cyan)', green: 'var(--ds-green)', amber: 'var(--ds-amber)', red: 'var(--ds-red)', gold: 'var(--ds-gold)',
  t1: '#c8dff0', t2: '#8aafc0', t3: '#4a7090',
};

const CSS = `
  .cc-card { background: ${DS.bg3}; border: 1px solid ${DS.bd}; border-radius: 8px; padding: 24px; }
  .cc-title { font-family: 'DM Mono', monospace; font-size: 11px; color: ${DS.t3}; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }
  
  .q-item { display: flex; align-items: flex-start; gap: 16px; padding: 16px; border-radius: 6px; background: ${DS.bg2}; border: 1px solid ${DS.bd}; margin-bottom: 8px; transition: border-color 0.2s; }
  .q-item:hover { border-color: ${DS.t3}; }
  
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .kpi-card { background: ${DS.bg2}; border: 1px solid ${DS.bd}; border-radius: 6px; padding: 20px; position: relative; overflow: hidden; }
  .kpi-val { font-family: 'Barlow Condensed', sans-serif; font-size: 36px; font-weight: 800; color: #fff; margin: 4px 0; }
  .kpi-sub { font-family: 'DM Mono', monospace; font-size: 11px; display: flex; align-items: center; gap: 4px; }
  .kpi-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; }
  
  .health-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid ${DS.bd}; font-family: 'DM Mono', monospace; font-size: 12px; }
  .health-item:last-child { border-bottom: none; }
  
  .map-container { position: relative; width: 100%; height: 300px; background: ${DS.bg2}; border: 1px solid ${DS.bd}; border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
  .map-pulse { position: absolute; width: 12px; height: 12px; background: ${DS.cyan}; border-radius: 50%; transform: translate(-50%, -50%); box-shadow: 0 0 10px ${DS.cyan}; }
  .map-pulse::after { content: ''; position: absolute; left: -100%; top: -100%; right: -100%; bottom: -100%; border: 2px solid ${DS.cyan}; border-radius: 50%; animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
  @keyframes pulse-ring { 0% { transform: scale(0.3); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
`;

export default function CommandCenterPage() {
  const { isDemo } = useAdminDemoMode();
  const [data, setData] = useState({ queue: [], metrics: null, health: null, routes: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const url = (p: string) => `/api/admin/${p}?demo=${isDemo}`;
        const [qRes, mRes, hRes, rRes] = await Promise.all([
          fetch(url('urgent-queue')), fetch(url('daily-metrics')),
          fetch(url('system-health')), fetch(url('active-routes'))
        ]);
        if (mounted) {
          setData({
            queue: (await qRes.json()).data || [],
            metrics: (await mRes.json()).data,
            health: (await hRes.json()).data,
            routes: (await rRes.json()).data || []
          });
        }
      } catch (e) {
        console.error('Failed to fetch admin data', e);
      } finally {
        if(mounted) setLoading(false);
      }
    };
    
    fetchData();
    
    // Listen for the custom event fired by AdminLayout toggle
    window.addEventListener('demo_mode_changed', fetchData);
    return () => {
      mounted = false;
      window.removeEventListener('demo_mode_changed', fetchData);
    };
  }, [isDemo]);

  if (loading || !data.metrics) {
    return <div style={{ color: DS.t2, fontFamily: 'DM Mono', fontSize: 13, padding: 40 }}>Sincronizando sistemas...</div>;
  }

  const { metrics, queue, health, routes } = data;

  const getPriorityColor = (p: string) => p === 'high' ? DS.red : p === 'medium' ? DS.amber : DS.t2;

  const LABELS: any = {
    institutional_approval: 'Empresas institucionales pendientes de aprobación',
    doc_verification: 'Documentos subidos sin verificar',
    stalled_deal: 'Deals estancados +5 días sin actividad',
    reported_publication: 'Publicación reportada por usuario'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      <style>{CSS}</style>
      
      {/* HEADER */}
      <div>
        <h1 style={{ fontFamily: 'Barlow Condensed', fontSize: 32, fontWeight: 800, margin: '0 0 4px', color: '#fff', letterSpacing: 0.5 }}>Command Center</h1>
        <p style={{ margin: 0, color: DS.t3, fontSize: 13 }}>Vista operativa central. Responde rápido a los cuellos de botella del sistema.</p>
      </div>

      {/* QUEUE */}
      <div className="cc-card">
        <h2 className="cc-title"><AlertTriangle size={14} color={DS.amber} /> Requiere atención hoy</h2>
        
        {queue.length === 0 ? (
          <div style={{ padding: 20, background: DS.bg2, borderRadius: 6, border: `1px solid ${DS.bd}`, color: DS.green, fontFamily: 'DM Mono', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={16} /> Todo en orden — No hay items que requieran atención en este momento.
          </div>
        ) : (
          queue.map((q: any, i: number) => (
            <div key={i} className="q-item">
              <div style={{ color: getPriorityColor(q.priority), marginTop: 2 }}>
                <AlertCircle size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: DS.t1, marginBottom: 4 }}>
                  <span style={{ color: getPriorityColor(q.priority), fontWeight: 700, marginRight: 8, fontFamily: 'DM Mono' }}>{q.count}</span> 
                  {LABELS[q.type] || q.type}
                </div>
                <div style={{ fontSize: 12, color: DS.t3 }}>
                  El más antiguo: {new Date(q.oldestItem).toLocaleString('es-AR')}
                </div>
              </div>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: `1px solid ${DS.bd}`, borderRadius: 4, padding: '6px 12px', color: DS.t2, fontSize: 11, fontFamily: 'DM Mono, monospace', cursor: 'pointer' }}>
                Revisar <ArrowRight size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* METRICS GRID */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-bar" style={{ background: DS.cyan }} />
          <div style={{ fontSize: 11, color: DS.t3, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Nuevos Usuarios (Hoy)</div>
          <div className="kpi-val">{metrics.newRegistrations.today}</div>
          <div className="kpi-sub" style={{ color: metrics.newRegistrations.trend >= 0 ? DS.green : DS.red }}>
            {metrics.newRegistrations.trend >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
            {Math.abs(metrics.newRegistrations.trend)}% vs ayer
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-bar" style={{ background: DS.green }} />
          <div style={{ fontSize: 11, color: DS.t3, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Deals Iniciados (Hoy)</div>
          <div className="kpi-val">{metrics.dealsInitiated.today}</div>
          <div className="kpi-sub" style={{ color: metrics.dealsInitiated.trend >= 0 ? DS.green : DS.red }}>
            {metrics.dealsInitiated.trend >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
            {Math.abs(metrics.dealsInitiated.trend)}% vs ayer
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-bar" style={{ background: DS.green }} />
          <div style={{ fontSize: 11, color: DS.t3, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Deals Cerrados (Hoy)</div>
          <div className="kpi-val">{metrics.dealsClosed.today}</div>
          <div className="kpi-sub" style={{ color: DS.t2 }}>
            <DollarSign size={12}/> ${metrics.dealsClosed.valueUsd.toLocaleString()} USD
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-bar" style={{ background: DS.cyan }} />
          <div style={{ fontSize: 11, color: DS.t3, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Usuarios Activos (Ahora)</div>
          <div className="kpi-val">{metrics.activeUsers.now}</div>
          <div className="kpi-sub" style={{ color: DS.t2 }}>
            Pico de {metrics.activeUsers.peak24h} en 24hs
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-bar" style={{ background: DS.amber }} />
          <div style={{ fontSize: 11, color: DS.t3, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>MRR Estimado</div>
          <div className="kpi-val" style={{ color: DS.amber }}>${metrics.mrrEstimated.current}</div>
          <div className="kpi-sub" style={{ color: metrics.mrrEstimated.delta >= 0 ? DS.green : DS.red }}>
            {metrics.mrrEstimated.delta >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
            +${metrics.mrrEstimated.delta} este mes
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-bar" style={{ background: DS.bd }} />
          <div style={{ fontSize: 11, color: DS.t3, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Groq API Tokens (Hoy)</div>
          <div className="kpi-val" style={{ fontSize: 28, marginTop: 12 }}>
            {(metrics.groqTokensUsed.today / 1000).toFixed(1)}K <span style={{ fontSize: 16, color: DS.t3, fontWeight: 500 }}>/ {(metrics.groqTokensUsed.limit / 1000).toFixed(0)}K</span>
          </div>
          <div className="kpi-sub" style={{ color: DS.t2 }}>
            Costo estimado: ${metrics.groqTokensUsed.costUsd.toFixed(2)} USD
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        
        {/* SVG MAP */}
        <div className="cc-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px 24px 16px' }}>
            <h2 className="cc-title" style={{ margin: 0 }}>Rutas Globales Activas</h2>
          </div>
          <div className="map-container">
            {/* Extremely simplified static SVG map projection representing continents */}
            <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.15, pointerEvents: 'none' }}>
              <path d="M150,100 Q200,80 250,120 T300,50" fill="none" stroke={DS.cyan} strokeWidth="40" strokeLinecap="round" />
              <path d="M180,200 Q220,250 200,350" fill="none" stroke={DS.cyan} strokeWidth="40" strokeLinecap="round" />
              <path d="M400,100 Q450,50 550,80 T650,150 T700,200" fill="none" stroke={DS.cyan} strokeWidth="60" strokeLinecap="round" />
              <path d="M420,200 Q450,300 500,320" fill="none" stroke={DS.cyan} strokeWidth="50" strokeLinecap="round" />
            </svg>
            
            {/* Simulated overlay nodes based on data */}
            {routes.length > 0 ? (
              <>
                <div className="map-pulse" style={{ left: '30%', top: '75%' }} title="Argentina" />
                <div className="map-pulse" style={{ left: '35%', top: '65%' }} title="Brasil" />
                <div className="map-pulse" style={{ left: '20%', top: '35%' }} title="Mexico / USA" />
                <div className="map-pulse" style={{ left: '50%', top: '30%' }} title="Europe" />
                <div className="map-pulse" style={{ left: '80%', top: '45%' }} title="China" />
                
                {/* Simulated connecting lines */}
                <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                  <line x1="30%" y1="75%" x2="80%" y2="45%" stroke={DS.cyan} strokeWidth="1" strokeDasharray="4 4" opacity="0.5">
                    <animate attributeName="stroke-dashoffset" from="100" to="0" dur="3s" repeatCount="indefinite" />
                  </line>
                  <line x1="35%" y1="65%" x2="50%" y2="30%" stroke={DS.cyan} strokeWidth="1" strokeDasharray="4 4" opacity="0.5">
                    <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" repeatCount="indefinite" />
                  </line>
                  <line x1="20%" y1="35%" x2="80%" y2="45%" stroke={DS.cyan} strokeWidth="1" strokeDasharray="4 4" opacity="0.5">
                    <animate attributeName="stroke-dashoffset" from="100" to="0" dur="4s" repeatCount="indefinite" />
                  </line>
                </svg>
              </>
            ) : (
              <div style={{ position: 'absolute', color: DS.t3, fontSize: 12, fontFamily: 'DM Mono' }}>Sin rutas activas</div>
            )}
          </div>
          <div style={{ padding: '16px 24px', background: DS.bg2, borderTop: `1px solid ${DS.bd}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'DM Mono', color: DS.t2 }}>
            <span>● Usuarios conectados: {metrics?.activeUsers?.now}</span>
            <span>→ Rutas activas: {routes?.length}</span>
            <span style={{ color: DS.green }}>Total en curso: ${routes?.reduce((acc: number, r: any) => acc + r.valueUsd, 0).toLocaleString()} USD</span>
          </div>
        </div>

        {/* SYSTEM HEALTH */}
        <div className="cc-card" style={{ padding: 0 }}>
          <div style={{ padding: '24px 24px 16px' }}>
            <h2 className="cc-title" style={{ margin: 0 }}>Estado del Sistema</h2>
          </div>
          <div>
            {health?.apis?.map((api: any, i: number) => {
              const color = api.status === 'down' ? DS.red : api.status === 'slow' ? DS.amber : DS.green;
              return (
                <div key={i} className="health-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                    <span style={{ color: DS.t1 }}>{api.name}</span>
                  </div>
                  <div style={{ color: DS.t3, display: 'flex', gap: 16 }}>
                    <span style={{ width: 60, textAlign: 'right' }}>{api.reqPerHour} req/h</span>
                    <span style={{ width: 50, textAlign: 'right', color: color }}>{api.latencyMs}ms</span>
                  </div>
                </div>
              );
            })}
            
            <div className="health-item" style={{ background: DS.bg2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: DS.green }} />
                <span style={{ color: DS.t1 }}>SQLite Data Base</span>
              </div>
              <div style={{ color: DS.t3 }}>
                OK · {health?.database?.tables[0]?.rowCount || 0} rows · {health?.database?.sizeKb}KB
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
